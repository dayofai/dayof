import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as allSchemaExports from './schema'; // Import all exports from schema.ts
import type { Env } from '../types';
import type { Logger } from '../utils/logger';

// Construct a schema object containing only table definitions.
// Drizzle's `schema` option in the client constructor expects an object
// mapping table names to table definitions. Including other exports from
// './schema.ts' (like relations objects or enums) directly in this specific
// object for client initialization can lead to type inference issues.
// Relations are typically resolved by Drizzle if defined in the same scope/module
// as the tables and are part of the broader schema type.
const tablesOnlySchemaConst = { // Renamed to avoid any potential naming conflicts
  certs: allSchemaExports.certs,
  passTypes: allSchemaExports.passTypes,
  passes: allSchemaExports.passes,
  devices: allSchemaExports.devices,
  registrations: allSchemaExports.registrations,
  apnsKeys: allSchemaExports.apnsKeys,
};

// Define the explicit type for our client using Neon serverless driver exclusively.
export type ActualAppDbClient = NeonHttpDatabase<typeof tablesOnlySchemaConst>;

// Singleton management with simple error tracking for resilience
let _dbClientInstance: ActualAppDbClient | null = null;
let _consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

/**
 * Returns a singleton Drizzle client with error resilience.
 * Automatically resets the connection after too many consecutive errors.
 */
export function getDbClient(env: Env, logger?: Logger): ActualAppDbClient {
  // Reset connection if we've had too many consecutive errors
  if (_dbClientInstance && _consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    logger?.error('Too many consecutive database errors, resetting connection', new Error('ConnectionReset'), {
      errorCount: _consecutiveErrors,
    });
    _dbClientInstance = null;
    _consecutiveErrors = 0;
  }
  
  if (_dbClientInstance) {
    return _dbClientInstance;
  }

  // Determine connection string priority:
  // 1. DATABASE_URL (set by Neon Vercel Integration for production/preview)
  // 2. DEV_DATABASE_URL (development environment override)
  let connectionString: string | undefined;
  let source: string = 'unknown';

  if (env.DATABASE_URL) {
    connectionString = env.DATABASE_URL;
    source = 'Neon Vercel Integration (DATABASE_URL)';
  } else if (env.DEV_DATABASE_URL) {
    connectionString = env.DEV_DATABASE_URL;
    source = 'Development environment (DEV_DATABASE_URL)';
  }

  if (!connectionString) {
    const errMsg = "No Neon database connection string found. Ensure DATABASE_URL (Vercel deployment) or DEV_DATABASE_URL (development) is set.";
    const logFn = logger ? logger.error : console.error;
    logFn(errMsg, new Error(errMsg), { 
      hasDatabaseUrl: !!env.DATABASE_URL,
      hasDevUrl: !!env.DEV_DATABASE_URL,
      environment: env.ENVIRONMENT || 'unknown'
    });
    throw new Error("Database configuration error: No Neon connection string found.");
  }

  logger?.info(`Initializing Neon serverless client using ${source}`);

  try {
    const drizzleLoggerEnabled = !!logger;
    const neonSql = neon(connectionString);
    
    // Wrap the query function to track consecutive errors for resilience
    const originalQuery = neonSql;
    const resilientSql: typeof neonSql = Object.assign(
      async (strings: TemplateStringsArray, ...values: any[]) => {
        try {
          const result = await originalQuery(strings, ...values);
          _consecutiveErrors = 0; // Reset on success
          return result;
        } catch (error) {
          _consecutiveErrors++;
          throw error;
        }
      },
      {
        // Copy over the transaction method if it exists
        transaction: originalQuery.transaction
      }
    ) as typeof neonSql;
    
    const newClientInstance = drizzle(resilientSql, { 
      schema: tablesOnlySchemaConst, 
      logger: drizzleLoggerEnabled 
    });
    
    _dbClientInstance = newClientInstance;
    logger?.info(`Successfully connected to Neon database via ${source}`);
    
    return _dbClientInstance;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger?.error(`Failed to connect to Neon database via ${source}`, error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Neon database connection failed: ${errorMessage}`);
  }
}

/**
 * Type for the Drizzle client with our schema using Neon serverless driver.
 */
export type DbClient = ActualAppDbClient;

/**
 * Re-export the `tablesOnlySchemaConst` object.
 * This is the exact schema instance that the `DbClient` (and its underlying
 * Drizzle instance) was initialized with. Consumers of `DbClient` (e.g.,
 * other modules performing database operations) MUST use this exported `schema`
 * object to ensure type consistency with the client instance. Using schema objects
 * imported directly from './schema.ts' with this client can lead to type errors.
 */
export const schema = tablesOnlySchemaConst;