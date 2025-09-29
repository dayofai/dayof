import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Config } from 'drizzle-kit';

const NEWLINE_REGEX = /\r?\n/;
const ENV_KV_REGEX = /^([^=]+)=(.*)$/;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: small env loader for CLI robustness
function loadPreviewEnvFiles(): void {
  const cwd = resolve(process.cwd());
  const appsDir = resolve(cwd, 'apps');
  const appDirs = existsSync(appsDir)
    ? readdirSync(appsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
    : [];

  const candidates = [
    // Monorepo root to package path fallback
    resolve(cwd, 'packages', 'database', '.env.preview.local'),
    // All app directories
    ...appDirs.map((app) => resolve(appsDir, app, '.env.preview.local')),
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

loadPreviewEnvFiles();

const url = process.env.TEMP_BRANCH_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    'Set TEMP_BRANCH_DATABASE_URL (ephemeral) or DATABASE_URL in a .env.preview.local file'
  );
}

export default {
  schema: './packages/database/schema/index.ts',
  out: './packages/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url,
  },
} satisfies Config;
