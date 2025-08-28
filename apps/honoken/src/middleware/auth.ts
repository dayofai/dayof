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