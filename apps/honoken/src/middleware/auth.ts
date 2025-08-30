import { Context, Next } from 'hono';
import { verifyToken } from '../storage'; // Adjusted import path
import type { Env } from '../types'; // Adjusted import path
import { createLogger, type Logger } from '../utils/logger'; // Added

/**
 * Hono middleware for Apple Pass authentication.
 * Verifies the Authorization header and token against pass parameters.
 */
export async function applePassAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const logger = createLogger(c); // Added
  const { passTypeIdentifier, serialNumber } = c.req.param();
  const auth = c.req.header('Authorization');

  if (!passTypeIdentifier || !serialNumber) {
    logger.error("Middleware error: Missing passTypeIdentifier or serialNumber param", {}); // Modified
    return c.json({ message: 'Bad Request: Missing required parameters' }, 400);
  }

  const verification = await verifyToken(c.env, passTypeIdentifier, serialNumber, auth, logger);
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
export async function applePassAuthForListMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const logger = createLogger(c);
  const { deviceLibraryIdentifier, passTypeIdentifier } = c.req.param();
  const auth = c.req.header('Authorization');

  if (!deviceLibraryIdentifier || !passTypeIdentifier) {
    logger.error("List auth middleware error: missing params", {});
    return c.json({ message: 'Bad Request: Missing required parameters' }, 400);
  }

  if (!auth || !auth.startsWith('ApplePass ')) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  const token = auth.substring(10).trim();
  if (!token) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  try {
    // Verify via storage layer to avoid duplicating DB logic
    const { verifyListAccessToken } = await import('../storage');
    const isAuthorized = await verifyListAccessToken(c.env, passTypeIdentifier, deviceLibraryIdentifier, token, logger);
    if (!isAuthorized) {
      return c.json({ message: 'Unauthorized' }, 401);
    }
  } catch (error) {
    logger.error('List auth middleware error', error instanceof Error ? error : new Error(String(error)));
    return c.json({ message: 'Unauthorized' }, 401);
  }

  await next();
}