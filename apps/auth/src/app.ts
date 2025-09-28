import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './auth';

const app = new Hono();

app.use('*', logger());

const ALLOW = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  '/*',
  cors({
    origin: (origin) =>
      origin && ALLOW.includes(origin) ? origin : undefined,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600,
  })
);

app.get('/health', (c) => c.json({ ok: true }));

// Handle all methods at the domain root
app.all('/*', (c) => auth.handler(c.req.raw));

export default app;
