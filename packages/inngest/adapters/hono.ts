import type { Hono } from 'hono';
import { serve } from 'inngest/hono';
import { inngest } from '../client';
import { functions } from '../functions';

export function mountInngest(app: Hono, path = '/api/inngest') {
  app.on(['GET', 'POST', 'PUT'], path, serve({ client: inngest, functions }));
}
