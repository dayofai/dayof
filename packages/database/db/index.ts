import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { schema } from '../schema';

const DATABASE_URL =
  process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL ?? '';

if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL (or NEON_DATABASE_URL) is not set in the environment'
  );
}

// Neon serverless fetch-based client works on Vercel Node.js (Fluid Compute)
const client = neon(DATABASE_URL);

// Use the typed overload so db.query.<table> is available
export const db = drizzle(client, { schema });
export type DB = typeof db;
