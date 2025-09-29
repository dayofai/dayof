import type { Context, Next } from 'hono';
import { verifyToken } from '../storage'; // Adjusted import path
import type { Env } from '../types'; // Adjusted import path
import { createLogger } from '../utils/logger'; // Added
import { getDbClient } from '../db';
import { schema as sharedSchema } from 'database/schema';

/**
 * Hono middleware for Apple Pass authentication.
 * Verifies the Authorization header and token against pass parameters.
 */
export async function applePassAuthMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  const logger = createLogger(c); // Added
  const { passTypeIdentifier, serialNumber } = c.req.param();
  const auth = c.req.header('Authorization');

  if (!(passTypeIdentifier && serialNumber)) {
    logger.error(
      'Middleware error: Missing passTypeIdentifier or serialNumber param',
      {}
    ); // Modified
    return c.json({ message: 'Bad Request: Missing required parameters' }, 400);
  }

  const verification = await verifyToken(
    c.env,
    passTypeIdentifier,
    serialNumber,
    auth,
    logger
  );
  if (verification.notFound) {
    return c.json({ message: 'Pass not found' }, 404);
  }
  if (!verification.valid) {
    // verifyToken returning invalid means unauthorized (token mismatch or missing)
    return c.json({ message: 'Unauthorized' }, 401);
  }

  await next();
}

/**
 * Auth middleware for the list-updated-serials route, which does not include a serialNumber.
 * Validates that the provided ApplePass token belongs to any pass of the given passTypeIdentifier
 * that is actively registered for the requesting deviceLibraryIdentifier.
 */
export async function applePassAuthForListMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  const logger = createLogger(c);
  const { deviceLibraryIdentifier, passTypeIdentifier } = c.req.param();
  const auth = c.req.header('Authorization');

  if (!(deviceLibraryIdentifier && passTypeIdentifier)) {
    logger.error('List auth middleware error: missing params', {});
    return c.json({ message: 'Bad Request: Missing required parameters' }, 400);
  }

  const { verifyListAccessToken, verifyListAccessByDeviceSecret } = await import(
    '../storage'
  );

  // Strategy order:
  // 1. If Authorization header present & valid scheme, validate it (token can be authToken OR the deviceLibraryIdentifier itself)
  // 2. Else (no header) try device secret fallback (active registration for device+passType)
  // 3. If header present but fails, attempt fallback before final 401

  let authorized = false;
  let failureReason: string | null = null;
  let tokenHash: string | undefined;

  const attemptDeviceFallback = async () => {
    const ok = await verifyListAccessByDeviceSecret(
      c.env,
      passTypeIdentifier,
      deviceLibraryIdentifier,
      logger
    );
    if (ok) {
      authorized = true;
      return true;
    }
    return false;
  };

  if (auth?.startsWith('ApplePass ')) {
    const token = auth.substring(10).trim();
    if (!token) {
      failureReason = 'empty_token';
    } else {
      // If token equals deviceLibraryIdentifier, treat as device secret
      if (token === deviceLibraryIdentifier) {
        authorized = await attemptDeviceFallback();
        if (!authorized) failureReason = 'device_secret_no_registration';
      } else {
        try {
          const isAuthorized = await verifyListAccessToken(
            c.env,
            passTypeIdentifier,
            deviceLibraryIdentifier,
            token,
            logger
          );
          if (isAuthorized) {
            authorized = true;
          } else {
            // Try fallback with device secret if token mismatch
            const fallbackOk = await attemptDeviceFallback();
            if (!fallbackOk) {
              failureReason = 'no_matching_registration_or_token';
            }
          }
        } catch (error) {
          failureReason = 'storage_error';
          logger.error(
            'List auth middleware error',
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
      // Compute hash for logging if not authorized
      if (!authorized) {
        try {
          const data = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(token)
          );
          tokenHash = Array.from(new Uint8Array(data))
            .slice(0, 6)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        } catch {
          tokenHash = 'hash_err';
        }
      }
    }
  } else {
    // No (or bad) Authorization header: fallback to device secret approach
    const fallback = await attemptDeviceFallback();
    if (!fallback) {
      failureReason = 'missing_or_bad_scheme';
    }
  }

  if (!authorized) {
    logger.info('list_auth_unauthorized', {
      reason: failureReason,
      hasAuth: !!auth,
      deviceLibraryIdentifier,
      passTypeIdentifier,
      tokenHash,
      path: c.req.path,
    });
    return c.json({ message: 'Unauthorized' }, 401);
  }

  c.header('X-List-Auth', 'ok');

  await next();
}
