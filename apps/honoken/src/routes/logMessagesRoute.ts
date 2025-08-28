import type { Context } from 'hono';
import type { Env } from '../types';
import { logMessages as storeLogMessages } from '../storage'; // Alias to avoid conflict if any
import type { LogMessagesPayload } from '../schemas';
import { createLogger, type Logger } from '../utils/logger';

export const handleLogMessages = async (c: Context<{ Bindings: Env }>) => {
  const logger = createLogger(c);
  const { logs } = c.req.valid('json') as LogMessagesPayload;

  try {
    await storeLogMessages(logs, logger);
    // Apple expects a 200 OK response for successfully logged messages.
    return c.json({ message: 'Logs received.' }, 200);
  } catch (error: any) {
    logger.error('Error in handleLogMessages', error);
    return c.json({ error: 'Internal Server Error', message: 'Failed to process logs.' }, 500);
  }
}; 