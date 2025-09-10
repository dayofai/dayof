import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth';

const app = new Hono();

const ALLOW = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  '/auth/*',
  cors({
    origin: (origin) =>
      origin ? (ALLOW.includes(origin) ? origin : 'null') : 'null',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600,
  })
);

// Handle all methods under /auth/*
app.all('/auth/*', (c) => auth.handler(c.req.raw));

app.get('/health', (c) => c.json({ ok: true }));

export default app;
export const config = { runtime: 'nodejs20.x' };
