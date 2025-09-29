import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'index.ts',
    client: 'client.ts',
    'client.browser': 'client.browser.ts',
    events: 'events.ts',
    'functions/index': 'functions/index.ts',
    'adapters/hono': 'adapters/hono.ts',
  },
  outDir: 'dist',
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node22',
  platform: 'node',
  external: ['inngest', 'hono', 'database', 'honoken'],
});
