import type { Context } from 'hono';
import type { PassPathParams } from '../schemas'; // Assuming path params are validated
import { unregisterDevice } from '../storage';
import type { Env } from '../types';
import { toErrorStatus } from '../utils/http';
import { createLogger } from '../utils/logger';

export const handleUnregisterDevice = async (c: Context<{ Bindings: Env }>) => {
  const logger = createLogger(c);
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } =
    c.req.valid('param') as PassPathParams;
  const authorizationHeader = c.req.header('Authorization');

  try {
    const result = await unregisterDevice(
      c.env,
      deviceLibraryIdentifier,
      passTypeIdentifier,
      serialNumber,
      authorizationHeader,
      logger
    );

    if (result.success) {
      // Apple requires 200 OK with empty body for successful unregistration
      return c.newResponse(null, 200);
    }
    return c.json(
      {
        error: 'Unregistration Failed',
        message: result.message || 'Could not process unregistration.',
      },
      toErrorStatus(result.status)
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Critical error in handleUnregisterDevice', err);
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected critical error occurred.',
      },
      500
    );
  }
};
