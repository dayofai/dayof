import { handle } from 'hono/vercel';
import app from '../src/app';

const h = handle(app);
export const GET = h;
export const POST = h;
export const PUT = h;
export const PATCH = h;
export const DELETE = h;
export const OPTIONS = h;

export const config = { runtime: 'nodejs20.x' };
