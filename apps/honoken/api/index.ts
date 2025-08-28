import { handle } from 'hono/vercel';
import app from '../src/index';

// Use Vercel's official Hono adapter
const handler = handle(app);

// Export individual HTTP method handlers as per Vercel best practices
export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler; 