import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { devtools as tanstackDevtools } from '@tanstack/devtools-vite';
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: { sourcemap: false },
  build: { sourcemap: false },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Force single Three.js instance to prevent duplicate imports
      three: path.resolve(__dirname, './node_modules/three'),
    },
    // Additional safety for peer deps
    dedupe: ['three', '@react-three/fiber'],
  },
  optimizeDeps: {
    // Help Vite's prebundler keep a single copy
    include: ['three'],
  },
  plugins: [
    tanstackDevtools(),
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStart({
      customViteReactPlugin: true,
    }),
    nitroV2Plugin({
      compatibilityDate: '2025-09-28',
    }),
    viteReact(),
    tailwindcss(),
  ],
});
