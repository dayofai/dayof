export * from 'database/db'; // Re-export everything from the shared DB package

import { db as sharedDb } from 'database/db';
import { schema as sharedSchema } from 'database/schema';
import type { Env } from '../types';
import type { Logger } from '../utils/logger';

export type DbClient = typeof sharedDb;

export function getDbClient(_env: Env, _logger?: Logger): DbClient {
  return sharedDb;
}

export const schema = sharedSchema;
