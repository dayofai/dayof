import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { schema } from '../schema';
import { relations } from '../schema/relations';

const DATABASE_URL =
  process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL ?? '';

if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL (or NEON_DATABASE_URL) is not set in the environment'
  );
}

// Configure Neon to use WebSocket connections where available so transactions are supported.
// Bun, Deno, and many runtimes expose a global WebSocket; Node requires the 'ws' polyfill.
// We prefer the global if present to avoid bundling Node-only deps in edge-like runtimes.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - global WebSocket may not be typed in all environments
const GlobalWebSocket: typeof WebSocket | undefined = (globalThis as any)
  ?.WebSocket;
if (GlobalWebSocket) {
  // Use the runtime's WebSocket implementation (Bun, Deno, browser-like)
  // Types across runtimes may not align exactly, but the constructor shape matches at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  neonConfig.webSocketConstructor = GlobalWebSocket as any;
}

// Create a Pool using Neon serverless driver. WebSocket is required for transactions.
const client = new Pool({ connectionString: DATABASE_URL });

// Use Drizzle v2 relational queries so db.query.<table> is available
export const db = drizzle(client, { schema, relations });
export type DB = typeof db;
