import { schema as sharedSchema } from 'database/schema';
import { and, eq } from 'drizzle-orm';
import type { Context, MiddlewareHandler } from 'hono';
import { type DbClient, getDbClient } from '../db';
import type { Env as AppEnv } from '../types';
import { createLogger } from '../utils/logger';

// Define a more specific Env type for this middleware context
// This defines what this middleware expects to be available in the context
interface PkpassContext {
  Bindings: AppEnv; // The base environment bindings
  Variables: {
    pkpassMetadata?: {
      etag: string;
      lastModified: Date;
      passRow: PassRowSummary;
      passContent?: unknown;
    };
  };
  // Hono typically infers path params based on the route string where the middleware is applied.
  // For a generic middleware, we assert the expected params structure at the point of use.
}

/**
 * Query minimal pass data required for conditional headers
 */
type PassRowSummary = {
  passTypeIdentifier: string;
  serialNumber: string;
  authenticationToken: string;
  ticketStyle: 'coupon' | 'event' | 'storeCard' | 'generic' | null;
  poster: boolean;
  updatedAt: Date;
  etag: string | null;
};

async function queryPassSummary(
  db: DbClient,
  passTypeIdentifier: string,
  serialNumber: string
): Promise<PassRowSummary | null> {
  const row = await db
    .select({
      passTypeIdentifier: sharedSchema.walletPass.passTypeIdentifier,
      serialNumber: sharedSchema.walletPass.serialNumber,
      authenticationToken: sharedSchema.walletPass.authenticationToken,
      ticketStyle: sharedSchema.walletPass.ticketStyle,
      poster: sharedSchema.walletPass.poster,
      updatedAt: sharedSchema.walletPass.updatedAt,
      etag: sharedSchema.walletPass.etag,
    })
    .from(sharedSchema.walletPass)
    .where(
      and(
        eq(sharedSchema.walletPass.passTypeIdentifier, passTypeIdentifier),
        eq(sharedSchema.walletPass.serialNumber, serialNumber)
      )
    )
    .limit(1)
    .then((r) => r[0] ?? null);
  return row;
}

function set304Headers(c: Context, etag: string, lastModified: Date) {
  c.header('ETag', etag);
  c.header('Last-Modified', lastModified.toUTCString());
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
}

function getStoredEtag(passRow: PassRowSummary): string | null {
  return passRow.etag ? `"${passRow.etag}"` : null;
}

function checkAndRespond304(
  c: Context,
  etag: string | null,
  lastModified: Date
): boolean {
  const inm = c.req.header('If-None-Match');
  if (etag && inm && inm === etag) {
    set304Headers(c, etag, lastModified);
    c.body(null, 304);
    return true;
  }
  const ims = c.req.header('If-Modified-Since');
  if (ims) {
    const imsDate = new Date(ims);
    const lastModifiedSeconds = Math.floor(lastModified.getTime() / 1000);
    const imsSeconds = Math.floor(imsDate.getTime() / 1000);
    if (!Number.isNaN(imsSeconds) && lastModifiedSeconds <= imsSeconds) {
      // In the IMS path, we don't require an ETag; still set headers consistently
      if (etag) {
        set304Headers(c, etag, lastModified);
      } else {
        c.header('Last-Modified', lastModified.toUTCString());
        c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
      c.body(null, 304);
      return true;
    }
  }
  return false;
}

export const pkpassEtagMiddleware: MiddlewareHandler<PkpassContext> = async (
  c,
  next
) => {
  const logger = createLogger(c);
  if (c.req.method !== 'GET') {
    await next();
    return;
  }

  const passTypeIdentifier = c.req.param('passTypeIdentifier') as
    | string
    | undefined;
  const serialNumber = c.req.param('serialNumber') as string | undefined;

  if (!(passTypeIdentifier && serialNumber)) {
    await next();
    return;
  }

  try {
    const db = getDbClient(c.env as AppEnv, logger);
    const passRow = await queryPassSummary(
      db,
      passTypeIdentifier,
      serialNumber
    );
    if (!passRow) {
      await next();
      return;
    }

    const currentEtag = getStoredEtag(passRow);
    const lastModifiedDate = new Date(passRow.updatedAt);

    if (checkAndRespond304(c, currentEtag, lastModifiedDate)) {
      return;
    }

    if (currentEtag) {
      c.set('pkpassMetadata', {
        etag: currentEtag,
        lastModified: lastModifiedDate,
        passRow,
        passContent: undefined,
      });
    } else {
      // Do not set pkpassMetadata if we don't have a stored ETag
      // Handler will still set headers as appropriate
    }

    await next();

    if (currentEtag) {
      c.header('ETag', currentEtag);
    }
    c.header('Last-Modified', lastModifiedDate.toUTCString());
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  } catch (error) {
    logger.error(
      'PKPass ETag middleware error',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
};
