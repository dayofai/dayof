import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tsconfigPaths({ projects: ["./tsconfig.json"], ignoreConfigErrors: true }),
    tailwindcss(),
    react(),
    tanstackStart({
      spa: { enabled: true },
      target: "vercel",
      customViteReactPlugin: true,
    }),
  ],
});
