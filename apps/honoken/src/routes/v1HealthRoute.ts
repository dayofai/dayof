import type { Context } from 'hono';
import { sql } from 'drizzle-orm';
import type { Env } from '../types';
import { getDbClient } from '../db';
import { createLogger, type Logger } from '../utils/logger';

export const handleV1Health = async (c: Context<{ Bindings: Env }>) => {
  const logger = createLogger(c);
  try {
    const db = getDbClient(c.env, logger);
    await db.execute(sql`SELECT 1`);
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Health check failed', error);
    return c.json({ status: 'error', message: 'Database connection failed' }, 503);
  }
}; 