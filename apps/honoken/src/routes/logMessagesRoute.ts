import type { Context } from 'hono';
import type { LogMessagesPayload } from '../schemas';
import { logMessages as storeLogMessages } from '../storage'; // Alias to avoid conflict if any
import type { Env } from '../types';
import { createLogger } from '../utils/logger';

export const handleLogMessages = async (c: Context<{ Bindings: Env }>) => {
  const logger = createLogger(c);
  const { logs } = c.req.valid('json') as LogMessagesPayload;

  try {
    await storeLogMessages(logs, logger);
    // Apple expects a 200 OK response for successfully logged messages.
    return c.json({ message: 'Logs received.' }, 200);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error in handleLogMessages', err);
    return c.json(
      { error: 'Internal Server Error', message: 'Failed to process logs.' },
      500
    );
  }
};
