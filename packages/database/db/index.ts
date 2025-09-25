import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { WebSocket as NodeWebSocket } from 'ws';
import { schema } from '../schema';
import { relations } from '../schema/relations';

const DATABASE_URL =
  process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL ?? '';

if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL (or NEON_DATABASE_URL) is not set in the environment'
  );
}

// Configure Neon to use a WebSocket constructor across runtimes
const globalWebSocket = (globalThis as { WebSocket?: typeof WebSocket })
  .WebSocket;
neonConfig.webSocketConstructor =
  globalWebSocket ?? (NodeWebSocket as unknown as typeof WebSocket);

// Create a Pool using Neon serverless driver. WebSocket is required for transactions.
const client = new Pool({ connectionString: DATABASE_URL });

// Use Drizzle v2 relational queries so db.query.<table> is available
export const db = drizzle(client, { schema, relations });
export type DB = typeof db;
