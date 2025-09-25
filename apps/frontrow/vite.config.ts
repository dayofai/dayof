import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  esbuild: { sourcemap: false },
  build: { sourcemap: false },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ['./tsconfig.json'], ignoreConfigErrors: true }),
    tanstackStart({ customViteReactPlugin: true }),
    react(),
    tailwindcss(),
  ],
});
