import { schema as sharedSchema } from 'database/schema';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod/v4';
import { getDbClient } from '../db/index';
import { pushToMany } from '../passkit/apnsFetch';
import { invalidateApnsKeyCache, storeApnsKey } from '../passkit/apnsKeys';
import { invalidateCertCache, storeCertBundle } from '../passkit/certs';
import { CertificateRotationBodySchema } from '../schemas';

import { CreateTestPassSchema } from '../schemas/createTestPassSchema';
import {
  CreateTestPassError,
  createTestPass,
} from '../services/createTestPass';
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
// Admin-only endpoint: POST /admin/create-test-pass
// -----------------------------------------------------------------------------
adminApp.post('/admin/create-test-pass', async (c) => {
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

    let input;
    try {
      input = CreateTestPassSchema.parse(payload);
    } catch (zodErr) {
      if (zodErr instanceof z.ZodError) {
        logger.warn('Test pass creation validation error', {
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

    logger.info('Attempting admin test pass creation', {
      adminUser: adminUser?.username || 'unknown',
      input,
    });

    const result = await createTestPass(c.env, logger, input);

    logger.info('Test pass created', {
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
        message: 'Test pass created.',
      },
      201
    );
  } catch (err) {
    if (err instanceof CreateTestPassError) {
      logger.warn('Admin test pass creation error', {
        message: err.message,
        friendlyMessage: err.friendlyMessage,
        statusCode: err.statusCode,
      });
      return c.json(
        {
          error: 'Test Pass Creation Error',
          message: err.friendlyMessage || err.message,
        },
        err.statusCode
      );
    }
    if (err instanceof z.ZodError) {
      logger.warn('Admin test pass creation Zod error', {
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
      'Unhandled error during admin test pass creation',
      err instanceof Error ? err : new Error(String(err)),
      { input: c.req.body }
    );
    throw new HTTPException(500, {
      message: 'Internal server error during test pass creation.',
    });
  }
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
