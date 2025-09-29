import { serve } from '@hono/node-server';
import app from './app.js';

console.log('Server is running on http://localhost:3001');

serve({
  fetch: app.fetch,
  port: 3001,
});
