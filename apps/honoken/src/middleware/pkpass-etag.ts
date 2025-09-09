import { schema as sharedSchema } from 'database/schema';
import { and, eq } from 'drizzle-orm';
import { Context, type MiddlewareHandler, Next } from 'hono';
import { getDbClient } from '../db'; // Remove DbEnv import
import { computeEtag, type PassWithContent } from '../db/etag'; // Pure compute; no writes in middleware
import type { Env as AppEnv } from '../types'; // Renamed to avoid conflict
import { createLogger, type Logger } from '../utils/logger';

// Define a more specific Env type for this middleware context
// This defines what this middleware expects to be available in the context
interface PkpassContext {
  Bindings: AppEnv; // The base environment bindings
  Variables: {
    pkpassMetadata?: {
      etag: string;
      lastModified: Date;
      passRow: PassWithContent;
      passContent?: any; // Pass content data when available
    };
  };
  // Hono typically infers path params based on the route string where the middleware is applied.
  // For a generic middleware, we assert the expected params structure at the point of use.
}

/**
 * Queries for pass data with content JOIN
 * TODO: When pass_content table exists, implement the actual JOIN query
 */
async function queryPassWithContent(
  db: any,
  passTypeIdentifier: string,
  serialNumber: string,
  logger?: Logger
): Promise<PassWithContent | null> {
  // TODO: When pass_content table exists, replace with:
  // const result = await db.select({
  //   // Pass fields
  //   serialNumber: schema.passes.serialNumber,
  //   passTypeIdentifier: schema.passes.passTypeIdentifier,
  //   authenticationToken: schema.passes.authenticationToken,
  //   ticketStyle: schema.passes.ticketStyle,
  //   poster: schema.passes.poster,
  //   passContentId: schema.passes.passContentId,
  //   updatedAt: schema.passes.updatedAt,
  //   // Content fields
  //   contentId: schema.passContent.id,
  //   description: schema.passContent.description,
  //   organizationName: schema.passContent.organizationName,
  //   contentUpdatedAt: schema.passContent.updatedAt,
  //   // ... other content fields
  // })
  // .from(schema.passes)
  // .leftJoin(schema.passContent, eq(schema.passes.passContentId, schema.passContent.id))
  // .where(and(
  //   eq(schema.passes.passTypeIdentifier, passTypeIdentifier),
  //   eq(schema.passes.serialNumber, serialNumber)
  // ))
  // .limit(1);

  // Query wallet_pass and optionally wallet_pass_content
  const passRow = await db
    .select({
      passTypeIdentifier: sharedSchema.walletPass.passTypeIdentifier,
      serialNumber: sharedSchema.walletPass.serialNumber,
      authenticationToken: sharedSchema.walletPass.authenticationToken,
      ticketStyle: sharedSchema.walletPass.ticketStyle,
      poster: sharedSchema.walletPass.poster,
      updatedAt: sharedSchema.walletPass.updatedAt,
    })
    .from(sharedSchema.walletPass)
    .where(
      and(
        eq(sharedSchema.walletPass.passTypeIdentifier, passTypeIdentifier),
        eq(sharedSchema.walletPass.serialNumber, serialNumber)
      )
    )
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!passRow) {
    return null;
  }

  // Transform to PassWithContent format
  // Load content JSON if available
  const content = await db
    .select({
      data: sharedSchema.walletPassContent.data,
      updatedAt: sharedSchema.walletPassContent.updatedAt,
    })
    .from(sharedSchema.walletPassContent)
    .where(
      and(
        eq(
          sharedSchema.walletPassContent.passTypeIdentifier,
          passTypeIdentifier
        ),
        eq(sharedSchema.walletPassContent.serialNumber, serialNumber)
      )
    )
    .limit(1)
    .then((r: any[]) => r[0]);

  const passWithContent: PassWithContent = {
    serialNumber: passRow.serialNumber,
    passTypeIdentifier: passRow.passTypeIdentifier,
    authenticationToken: passRow.authenticationToken,
    ticketStyle: passRow.ticketStyle,
    poster: passRow.poster,
    updatedAt: passRow.updatedAt,
    passContent: content
      ? {
          id: `${passRow.passTypeIdentifier}:${passRow.serialNumber}`,
          description: '',
          organizationName: '',
          updatedAt: content.updatedAt,
          ...content.data,
        }
      : undefined,
  };

  return passWithContent;
}

/**
 * PKPass ETag Middleware
 *
 * Specialized middleware for Apple Wallet PKPass file caching using ETags.
 * Handles both If-None-Match and If-Modified-Since headers based on pass data.
 * Uses stored ETags with lazy computation for optimal performance.
 * Computes ETags from both pass metadata and content via query-time JOINs.
 */
export const pkpassEtagMiddleware: MiddlewareHandler<PkpassContext> = async (
  c,
  next
) => {
  const logger = createLogger(c);
  if (c.req.method !== 'GET') {
    await next();
    return;
  }

  // Explicitly cast param types for clarity within this generic middleware
  const passTypeIdentifier = c.req.param('passTypeIdentifier') as
    | string
    | undefined;
  const serialNumber = c.req.param('serialNumber') as string | undefined;

  if (!(passTypeIdentifier && serialNumber)) {
    await next();
    return;
  }

  try {
    // Assert that c.env conforms to AppEnv for getDbClient
    const db = getDbClient(c.env as AppEnv, logger);

    // Query pass data with content JOIN
    const passWithContent = await queryPassWithContent(
      db,
      passTypeIdentifier,
      serialNumber,
      logger
    );

    if (!passWithContent) {
      await next();
      return;
    }

    // Compute ETag using both pass metadata and content (pure, no writes)
    const etagValue = await computeEtag(passWithContent);
    const currentEtag = `"${etagValue}"`;

    const ifNoneMatchHeader = c.req.header('If-None-Match');
    if (ifNoneMatchHeader && ifNoneMatchHeader === currentEtag) {
      // RFC 7234 Section 4.3.4: 304 responses MUST include ETag and Last-Modified
      // headers if they would be sent in a 200 response

      // For Last-Modified, use the most recent update time between pass and content
      let lastModifiedDate = new Date(passWithContent.updatedAt);
      if (
        passWithContent.passContent &&
        passWithContent.passContent.updatedAt
      ) {
        const contentUpdatedAt = new Date(
          passWithContent.passContent.updatedAt
        );
        if (contentUpdatedAt > lastModifiedDate) {
          lastModifiedDate = contentUpdatedAt;
        }
      }

      c.header('ETag', currentEtag);
      c.header('Last-Modified', lastModifiedDate.toUTCString());
      c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      return c.body(null, 304);
    }

    // For Last-Modified, use the most recent update time between pass and content
    let lastModifiedDate = new Date(passWithContent.updatedAt);
    if (passWithContent.passContent && passWithContent.passContent.updatedAt) {
      const contentUpdatedAt = new Date(passWithContent.passContent.updatedAt);
      if (contentUpdatedAt > lastModifiedDate) {
        lastModifiedDate = contentUpdatedAt;
      }
    }

    const ifModifiedSinceHeader = c.req.header('If-Modified-Since');
    if (ifModifiedSinceHeader) {
      try {
        const ifModifiedSinceDate = new Date(ifModifiedSinceHeader);
        // Truncate both dates to second precision for Apple Wallet compatibility
        // Apple Wallet sends If-Modified-Since rounded to seconds, but DB timestamps have millisecond precision
        const lastModifiedSeconds = Math.floor(
          lastModifiedDate.getTime() / 1000
        );
        const ifModifiedSinceSeconds = Math.floor(
          ifModifiedSinceDate.getTime() / 1000
        );

        if (lastModifiedSeconds <= ifModifiedSinceSeconds) {
          // RFC 7234 Section 4.3.4: 304 responses MUST include ETag and Last-Modified
          // headers if they would be sent in a 200 response
          c.header('ETag', currentEtag);
          c.header('Last-Modified', lastModifiedDate.toUTCString());
          c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
          return c.body(null, 304);
        }
      } catch (e) {
        logger.warn('Invalid If-Modified-Since header received', {
          ifModifiedSinceHeader,
          error: e,
        });
      }
    }

    c.set('pkpassMetadata', {
      etag: currentEtag,
      lastModified: lastModifiedDate,
      passRow: passWithContent,
      passContent: passWithContent.passContent,
    });

    await next();

    if (c.res) {
      if (!c.res.headers.has('ETag')) {
        c.header('ETag', currentEtag);
      }
      if (!c.res.headers.has('Last-Modified')) {
        c.header('Last-Modified', lastModifiedDate.toUTCString());
      }
      if (!c.res.headers.has('Cache-Control')) {
        c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  } catch (error) {
    logger.error(
      'PKPass ETag middleware error',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
};
