import 'dotenv/config';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { mountInngest } from 'inngest-kit/adapters/hono';

const app = new Hono();
app.use('*', logger());

app.get('/', (c) => c.text('OK'));
mountInngest(app, '/api/inngest');

import { serve } from '@hono/node-server';

serve({ fetch: app.fetch, port: Number(process.env.PORT) || 3001 });

export default app;
export const config = { runtime: 'nodejs20.x' };
