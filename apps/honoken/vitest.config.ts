/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use Node.js environment to match Vercel runtime
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
    passWithNoTests: false,
    testTimeout: 30000, // 30 seconds for tests that hit external services
    hookTimeout: 30000, // 30 seconds for setup/teardown
  },
  resolve: {
    alias: {
      // Remove Cloudflare-specific aliases
      "~/": new URL("./src/", import.meta.url).pathname,
    },
  },
});
