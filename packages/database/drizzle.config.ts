import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Config } from 'drizzle-kit';

const NEWLINE_REGEX = /\r?\n/;
const ENV_KV_REGEX = /^([^=]+)=(.*)$/;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: small env loader for CLI robustness
function loadEnvFiles(): void {
  const cwd = resolve(process.cwd());
  const candidates = [
    // Current working directory first
    resolve(cwd, '.env.local'),
    // Monorepo root to package path fallback
    resolve(cwd, 'packages', 'database', '.env.local'),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) {
      continue;
    }
    try {
      const content = readFileSync(path, 'utf8');
      const lines = content.split(NEWLINE_REGEX);
      for (const line of lines) {
        const match = line.match(ENV_KV_REGEX);
        if (!match) {
          continue;
        }
        const key = match[1];
        if (process.env[key]) {
          continue;
        }
        let value = match[2];
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    } catch {
      // ignore
    }
  }
}

loadEnvFiles();

const url = process.env.TEMP_BRANCH_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error('Set TEMP_BRANCH_DATABASE_URL (ephemeral) or DATABASE_URL');
}

export default {
  schema: './packages/database/schema/index.ts',
  out: './packages/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url,
  },
} satisfies Config;
