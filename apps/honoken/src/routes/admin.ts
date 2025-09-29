import { schema as sharedSchema } from 'database/schema';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { z } from 'zod/v4';
import { getDbClient } from '../db/index';
import { pushToMany } from '../passkit/apnsFetch';
import { invalidateApnsKeyCache, storeApnsKey } from '../passkit/apnsKeys';
import { invalidateCertCache, storeCertBundle } from '../passkit/certs';
import { CertificateRotationBodySchema } from '../schemas';
import { PassDataEventTicketSchema } from '../schemas/passContentSchemas';
import {
  projectCanonicalToPassData,
  normalizeWebServiceURL,
  CANONICAL_PASS_SCHEMA_VERSION,
  CanonicalPassSchemaV1,
  type AnyCanonicalPass,
} from '../domain/canonicalPass';
import { upsertPassContentWithEtag } from '../repo/wallet';

import { CreatePassSchema } from '../schemas/createPassSchema';
import {
  CreatePassError,
  createPass,
} from '../services/createPass';
import type { Env } from '../types';
import { createLogger, type Logger } from '../utils/logger';

// Zod schema for APNs key uploads
const ApnsKeyUploadSchema = z.object({
  keyRef: z.string().min(1, { message: 'keyRef is required' }),
  teamId: z.string().min(1, { message: 'teamId is required' }),
  keyId: z.string().min(1, { message: 'keyId is required' }),
  p8Pem: z.string().min(1, { message: 'p8Pem is required' }),
});

type AdminAppVariables = {
  logger: Logger;
  adminUser?: {
    username: string;
  };
};

const adminApp = new Hono<{ Bindings: Env; Variables: AdminAppVariables }>();

// Basic Auth Middleware (ensure ADMIN_USERNAME and ADMIN_PASSWORD are set as secrets)
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: needed complexity
adminApp.use('/admin/*', async (c, next) => {
  const logger = createLogger(c);
  c.set('logger', logger);

  // On Vercel/Node, environment variables are exposed via process.env.
  // c.env is not automatically populated like on Workers. Fall back to process.env.
  const user =
    c.env.HONOKEN_ADMIN_USERNAME || process.env.HONOKEN_ADMIN_USERNAME;
  const pass =
    c.env.HONOKEN_ADMIN_PASSWORD || process.env.HONOKEN_ADMIN_PASSWORD;
  if (!(user && pass)) {
    logger.error(
      'Admin Basic Auth secrets not set. HONOKEN_ADMIN_USERNAME or HONOKEN_ADMIN_PASSWORD missing.',
      {}
    );

    const isProd = c.env.ENVIRONMENT === 'production';

    return c.json(
      {
        error: isProd
          ? 'Service temporarily unavailable'
          : 'Authorization not configured on server.',
      },
      503
    );
  }

  // Extract authorization details for logging before auth attempt
  let attemptedUsername: string | undefined;
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Basic ')) {
    try {
      const decoded = atob(authHeader.substring(6)); // Decode base64 part
      attemptedUsername = decoded.split(':')[0];
    } catch {
      // Malformed header, ignore for username extraction
    }
  }

  // Capture client IP and user agent for logging
  const clientIp =
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';

  // Set up basic auth without the unsupported onSuccess option
  const auth = basicAuth({ username: user, password: pass });

  try {
    const result = await auth(c, async () => {
      c.set('adminUser', { username: user });

      // Log successful authentication to PostHog
      logger.info('admin_authentication_success', {
        admin_username: user,
        client_ip: clientIp,
        user_agent: userAgent,
        path: c.req.path,
      });

      return await next();
    });

    // If middleware returned a 401 response (instead of throwing), log it and return
    if (result instanceof Response && result.status === 401) {
      logger.warn('admin_authentication_failure', {
        attempted_username: attemptedUsername || 'not_provided_or_malformed',
        client_ip: clientIp,
        user_agent: userAgent,
        path: c.req.path,
        reason: 'invalid_credentials',
      });
    }
    return result;
  } catch (_err) {
    // Hono basicAuth throws HTTPException on failure in some versions – normalize to 401 JSON
    logger.warn('admin_authentication_failure', {
      attempted_username: attemptedUsername || 'not_provided_or_malformed',
      client_ip: clientIp,
      user_agent: userAgent,
      path: c.req.path,
      reason: 'invalid_credentials',
    });
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

adminApp.put('/admin/certs/:certRef', async (c) => {
  const logger = c.get('logger');
  const adminUser = c.get('adminUser');
  const certRef = c.req.param('certRef');

  if (!certRef) {
    throw new HTTPException(400, {
      message: 'certRef path parameter is required.',
    });
  }

  logger.info('Admin attempting certificate bundle rotation', {
    adminUsername: adminUser?.username || 'unknown',
    certRef,
  });

  try {
    const body = await c.req.json();
    const validatedBody = CertificateRotationBodySchema.parse(body);

    await storeCertBundle(
      certRef,
      validatedBody.bundleData,
      validatedBody.isEnhanced,
      validatedBody.description ?? null,
      validatedBody.teamId,
      c.env,
      logger
    );

    // Immediately invalidate the cache in this isolate to ensure the next read gets fresh data
    invalidateCertCache(certRef, logger);

    logger.info('Certificate bundle rotation successful', {
      adminUsername: adminUser?.username || 'unknown',
      certRef,
      teamId: validatedBody.teamId,
    });

    return c.json(
      {
        success: true,
        message: `Certificate bundle for certRef '${certRef}' updated successfully.`,
      },
      200
    );
  } catch (error: unknown) {
    // Check for Zod validation errors
    if (error instanceof z.ZodError) {
      logger.error('Certificate rotation validation failed', error, {
        certRef,
      });
      return c.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: z.prettifyError(error),
        },
        400
      );
    }

    logger.error(
      'Certificate rotation failed',
      error instanceof Error ? error : new Error(String(error)),
      { certRef }
    );

    throw new HTTPException(500, {
      message: `Failed to update certificate bundle: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

// -----------------------------------------------------------------------------
// Admin endpoint: POST /admin/apns-keys for APNs .p8 key upload
// -----------------------------------------------------------------------------
adminApp.post('/admin/apns-keys', async (c) => {
  const logger = c.get('logger');
  const adminUser = c.get('adminUser');
  try {
    const body = await c.req.json();
    const validatedBody = ApnsKeyUploadSchema.parse(body);

    logger.info('Admin attempting APNs key upload', {
      adminUsername: adminUser?.username || 'unknown',
      keyRef: validatedBody.keyRef,
      teamId: validatedBody.teamId,
      keyId: validatedBody.keyId,
    });

    await storeApnsKey(
      validatedBody.keyRef,
      validatedBody.teamId,
      validatedBody.keyId,
      validatedBody.p8Pem,
      c.env,
      logger
    );

    // Invalidate APNs key cache to refresh immediately
    invalidateApnsKeyCache(validatedBody.keyRef, logger);

    logger.info('APNs key upload successful', {
      adminUsername: adminUser?.username || 'unknown',
      keyRef: validatedBody.keyRef,
      teamId: validatedBody.teamId,
      keyId: validatedBody.keyId,
    });

    return c.json(
      {
        success: true,
        message: `APNs key uploaded for keyRef '${validatedBody.keyRef}' successfully.`,
        keyRef: validatedBody.keyRef,
      },
      201
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      logger.error('APNs key upload validation failed', error, {
        errorDetails: z.prettifyError(error),
      });
      return c.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: z.prettifyError(error),
        },
        400
      );
    }

    logger.error(
      'APNs key upload failed',
      error instanceof Error ? error : new Error(String(error))
    );

    throw new HTTPException(500, {
      message: `Failed to upload APNs key: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

// -----------------------------------------------------------------------------
// Admin-only endpoint: POST /admin/create-pass
// -----------------------------------------------------------------------------
adminApp.post('/admin/create-pass', async (c) => {
  const logger = c.get('logger');
  const adminUser = c.get('adminUser');
  // Use request URL's origin directly for downloadUrl
  let requestUrlOrigin: string;
  try {
    requestUrlOrigin = new URL(c.req.url).origin;
  } catch {
    requestUrlOrigin = '';
  }

  try {
    const payload = await c.req.json();

    let input: z.infer<typeof CreatePassSchema>;
    try {
      input = CreatePassSchema.parse(payload);
    } catch (zodErr) {
      if (zodErr instanceof z.ZodError) {
        logger.warn('Pass creation validation error', {
          zodDetails: z.prettifyError(zodErr),
          input: payload,
        });
        return c.json(
          {
            error: 'Validation Failed',
            message: 'Input is invalid.',
            validation_issues: z.prettifyError(zodErr),
          },
          400
        );
      }
      throw zodErr;
    }

    logger.info('Attempting admin pass creation', {
      adminUser: adminUser?.username || 'unknown',
      input,
    });

    const result = await createPass(c.env, logger, input);

    logger.info('Pass created', {
      adminUser: adminUser?.username || 'unknown',
      passTypeIdentifier: result.passTypeIdentifier,
      serialNumber: result.serialNumber,
      certRef: result.certRef,
      warnings: result.warnings,
    });

    // Build absolute downloadUrl for pass file
    const downloadUrl = new URL(
      result.downloadPath,
      requestUrlOrigin || c.req.url
    ).toString();

    return c.json(
      {
        ...result,
        downloadUrl,
        warnings: result.warnings,
        success: true,
        message: 'Pass created.',
      },
      201
    );
  } catch (err) {
    if (err instanceof CreatePassError) {
      logger.warn('Admin pass creation error', {
        message: err.message,
        friendlyMessage: err.friendlyMessage,
        statusCode: err.statusCode,
      });
      return c.json(
        {
          error: 'Pass Creation Error',
          message: err.friendlyMessage || err.message,
        },
        err.statusCode as ContentfulStatusCode
      );
    }
    if (err instanceof z.ZodError) {
      logger.warn('Admin pass creation Zod error', {
        errorDetails: z.prettifyError(err),
      });
      return c.json(
        {
          error: 'Validation Failed',
          message: z.prettifyError(err),
        },
        400
      );
    }
    logger.error(
      'Unhandled error during admin pass creation',
      err instanceof Error ? err : new Error(String(err)),
      { path: c.req.path }
    );
    throw new HTTPException(500, {
      message: 'Internal server error during pass creation.',
    });
  }
});

// -----------------------------------------------------------------------------
// Admin-only endpoint: PATCH /admin/update-pass/:passTypeIdentifier/:serialNumber
// Shallow merges JSON body into existing pass content, recomputes ETag.
// Optional query param ?push=1 to immediately send silent push if content changed.
// -----------------------------------------------------------------------------
adminApp.patch('/admin/update-pass/:passTypeIdentifier/:serialNumber', async (c) => {
  const logger = c.get('logger');
  const passTypeIdentifier = c.req.param('passTypeIdentifier');
  const serialNumber = c.req.param('serialNumber');
  const shouldPush = c.req.query('push') === '1';

  if (!(passTypeIdentifier && serialNumber)) {
    throw new HTTPException(400, { message: 'passTypeIdentifier and serialNumber path params are required.' });
  }

  try {
    const db = getDbClient(c.env, logger);
    const passRow = await db.query.walletPass.findFirst({
      where: { passTypeIdentifier, serialNumber },
      columns: { id: true, eventId: true },
    });
    if (!passRow) {
      throw new HTTPException(404, { message: 'Pass not found.' });
    }
    const existingContent = await db.query.walletPassContent.findFirst({
      where: { passId: passRow.id },
      columns: { data: true },
    });
    const rawCurrent = existingContent?.data ?? {};
    const currentCanonical: AnyCanonicalPass | null =
      rawCurrent &&
      typeof rawCurrent === 'object' &&
      '_schemaVersion' in rawCurrent
        ? (rawCurrent as AnyCanonicalPass)
        : null;

    let incoming: unknown;
    try {
      incoming = await c.req.json();
    } catch {
      throw new HTTPException(400, { message: 'Body must be valid JSON object.' });
    }
    if (typeof incoming !== 'object' || incoming === null || Array.isArray(incoming)) {
      throw new HTTPException(400, { message: 'Body must be a JSON object.' });
    }

    // Decide pathway: if body contains _schemaVersion or canonical keys, treat as canonical full/partial replacement.
    let toStore: AnyCanonicalPass;
    const isCanonicalIncoming = '_schemaVersion' in (incoming as any);
    if (isCanonicalIncoming) {
      // Normalize webServiceURL if present
      if (typeof (incoming as any).distribution?.webServiceURL === 'string') {
        (incoming as any).distribution.webServiceURL = normalizeWebServiceURL(
          (incoming as any).distribution.webServiceURL
        );
      }
      const validated = CanonicalPassSchemaV1.parse(incoming);
      toStore = validated;
    } else {
      return c.json(
        {
          error: 'Unsupported Payload',
          message:
            '_schemaVersion required',
        },
        400
      );
    }

    const { etag, changed } = await upsertPassContentWithEtag(
      db,
      { passTypeIdentifier, serialNumber },
      toStore
    );
    logger.info('Pass updated', { passTypeIdentifier, serialNumber, changed, etag });

    let pushed: number | undefined = undefined;
    if (shouldPush && changed) {
      // Load active registrations
      const regs = await db
        .select({
          pushToken: sharedSchema.walletDevice.pushToken,
          deviceLibraryIdentifier: sharedSchema.walletDevice.deviceLibraryIdentifier,
        })
        .from(sharedSchema.walletRegistration)
        .innerJoin(
          sharedSchema.walletDevice,
          eq(
            sharedSchema.walletRegistration.deviceLibraryIdentifier,
            sharedSchema.walletDevice.deviceLibraryIdentifier
          )
        )
        .where(
          and(
            eq(sharedSchema.walletRegistration.passTypeIdentifier, passTypeIdentifier),
            eq(sharedSchema.walletRegistration.serialNumber, serialNumber),
            eq(sharedSchema.walletRegistration.active, true)
          )
        );
      if (regs.length > 0) {
        const report = await pushToMany(c.env, regs, passTypeIdentifier, logger);
        pushed = report.summary.attempted;
      } else {
        pushed = 0;
      }
    }

    return c.json({ success: true, changed, etag, pushed }, 200);
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    logger.error('Unhandled error in update-pass', error instanceof Error ? error : new Error(String(error)), {
      passTypeIdentifier,
      serialNumber,
    });
    throw new HTTPException(500, { message: 'Internal error updating pass.' });
  }
});

// -----------------------------------------------------------------------------
// Admin-only endpoint: GET /admin/pass-raw/:passTypeIdentifier/:serialNumber
// Returns the raw stored JSON (diagnostic helper)
// -----------------------------------------------------------------------------
adminApp.get('/admin/pass-raw/:passTypeIdentifier/:serialNumber', async (c) => {
  const logger = c.get('logger');
  const passTypeIdentifier = c.req.param('passTypeIdentifier');
  const serialNumber = c.req.param('serialNumber');
  if (!(passTypeIdentifier && serialNumber)) {
    throw new HTTPException(400, { message: 'passTypeIdentifier and serialNumber required.' });
  }
  const db = getDbClient(c.env, logger);
  const passRow = await db.query.walletPass.findFirst({
    where: { passTypeIdentifier, serialNumber },
      columns: { id: true, eventId: true },
  });
  if (!passRow) throw new HTTPException(404, { message: 'Pass not found.' });
  const content = await db.query.walletPassContent.findFirst({
    where: { passId: passRow.id },
    columns: { data: true },
  });
  const raw = content?.data ?? null;
  return c.json({ success: true, raw }, 200);
});

adminApp.post('/admin/invalidate/certs/:certRef', async (c) => {
  const logger = c.get('logger');
  const adminUser = c.get('adminUser');
  const certRef = c.req.param('certRef');

  if (!certRef) {
    throw new HTTPException(400, {
      message: 'certRef path parameter is required.',
    });
  }

  try {
    // Check if the certificate exists before invalidating its cache
    const db = getDbClient(c.env, logger);
    const exists = await db.query.walletCert.findFirst({
      where: { certRef },
      columns: { certRef: true },
    });

    if (!exists) {
      logger.warn('Attempted to invalidate non-existent certificate', {
        adminUsername: adminUser?.username || 'unknown',
        certRef,
      });
      throw new HTTPException(404, {
        message: `Certificate with certRef '${certRef}' not found.`,
      });
    }

    invalidateCertCache(certRef, logger);

    logger.info('Manual certificate cache invalidation successful', {
      adminUsername: adminUser?.username || 'unknown',
      certRef,
    });

    return c.json(
      {
        success: true,
        message: `Cache for certRef '${certRef}' has been invalidated.`,
      },
      200
    );
  } catch (error: unknown) {
    if (error instanceof HTTPException) {
      throw error;
    }

    logger.error(
      'Manual certificate cache invalidation failed',
      error instanceof Error ? error : new Error(String(error)),
      { certRef }
    );

    throw new HTTPException(500, {
      message: `Failed to invalidate cache: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

export default adminApp; // To be mounted in your main worker src/index.ts

// Dev-only push endpoint: POST /admin/push/:passTypeIdentifier/:serialNumber
adminApp.post('/admin/push/:passTypeIdentifier/:serialNumber', async (c) => {
  const logger = c.get('logger');
  const passTypeIdentifier = c.req.param('passTypeIdentifier');
  const serialNumber = c.req.param('serialNumber');

  if (!(passTypeIdentifier && serialNumber)) {
    throw new HTTPException(400, {
      message: 'passTypeIdentifier and serialNumber are required.',
    });
  }

  // Allow only in non-production
  if (c.env.ENVIRONMENT === 'production') {
    throw new HTTPException(403, {
      message: 'Admin push is disabled in production.',
    });
  }

  const db = getDbClient(c.env, logger);

  // Load active registrations for this pass
  const regs = await db
    .select({
      pushToken: sharedSchema.walletDevice.pushToken,
      deviceLibraryIdentifier:
        sharedSchema.walletDevice.deviceLibraryIdentifier,
    })
    .from(sharedSchema.walletRegistration)
    .innerJoin(
      sharedSchema.walletDevice,
      eq(
        sharedSchema.walletRegistration.deviceLibraryIdentifier,
        sharedSchema.walletDevice.deviceLibraryIdentifier
      )
    )
    .where(
      and(
        eq(
          sharedSchema.walletRegistration.passTypeIdentifier,
          passTypeIdentifier
        ),
        eq(sharedSchema.walletRegistration.serialNumber, serialNumber),
        eq(sharedSchema.walletRegistration.active, true)
      )
    );

  if (regs.length === 0) {
    return c.json(
      { success: true, pushed: 0, message: 'No active registrations.' },
      200
    );
  }

  const report = await pushToMany(c.env, regs, passTypeIdentifier, logger);
  return c.json({ success: true, pushed: report.summary.attempted }, 200);
});
