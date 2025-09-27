import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { devtools as tanstackDevtools } from '@tanstack/devtools-vite';
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  esbuild: { sourcemap: false },
  build: { sourcemap: false },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    tanstackDevtools(),
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStart({ customViteReactPlugin: true }),
    nitroV2Plugin(),
    viteReact(),
    tailwindcss(),
  ],
});
