import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'index.ts',
    'schema/index': 'schema/index.ts',
    'db/index': 'db/index.ts',
    'runtime/zod': 'runtime/zod.ts',
    'runtime/effect': 'runtime/effect.ts',
  },
  outDir: 'dist',
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node22',
  platform: 'node',
  external: ['@neondatabase/serverless', 'drizzle-orm', 'ws'],
});
