import type { Context } from 'hono';
import type { Env } from '../types';
import { listUpdatedSerials } from '../storage';
import type { DevicePassRegistrationsParams } from '../schemas';
import { createLogger, type Logger } from '../utils/logger';

export const handleListUpdatedSerials = async (c: Context<{ Bindings: Env }>) => {
  const logger = createLogger(c);
  const { deviceLibraryIdentifier, passTypeIdentifier } = c.req.valid('param') as DevicePassRegistrationsParams;
  
  const passesUpdatedSince = c.req.query('passesUpdatedSince');

  const filters: { passesUpdatedSince?: string } = {};
  if (passesUpdatedSince) {
    filters.passesUpdatedSince = passesUpdatedSince;
  }

  try {
    const result = await listUpdatedSerials(
      c.env,
      deviceLibraryIdentifier,
      passTypeIdentifier,
      filters,
      logger
    );

    if (!result || result.serialNumbers.length === 0) {
      return c.newResponse(null, 204); // Correct: 204 No Content must not have a body
    }

    return c.json(result, 200);
  } catch (error: any) {
    logger.error('Error in handleListUpdatedSerials', error);
    return c.json({ error: 'Internal Server Error', message: 'An unexpected error occurred.' }, 500);
  }
}; 