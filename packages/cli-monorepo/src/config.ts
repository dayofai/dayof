import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type VercelProjectsConfig = {
  team: string;
  apps: Record<string, string>;
  sourceProjectForCli?: string;
};

export type NeonConfig = {
  NEON_API_KEY: string;
  NEON_PROJECT_ID: string;
};

const homeDirectory = process.env.HOME || process.env.USERPROFILE || '.';

/**
 * Get the package root directory
 */
function getPackageRoot(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // src -> package root (works for both src/ and dist/ builds)
  return resolve(__dirname, '..');
}

/**
 * Read Vercel projects configuration
 */
export function readVercelConfig(): VercelProjectsConfig {
  const packageRoot = getPackageRoot();
  const cwd = process.cwd();

  // Try multiple candidates in order of preference
  const candidates = [
    resolve(packageRoot, 'vercel-projects.json'), // packages/cli-monorepo/vercel-projects.json
    resolve(cwd, 'packages', 'cli-monorepo', 'vercel-projects.json'), // cwd/packages/cli-monorepo/vercel-projects.json
    resolve(cwd, 'vercel-projects.json'), // cwd/vercel-projects.json
    resolve(cwd, 'scripts', 'vercel-projects.json'), // legacy: cwd/scripts/vercel-projects.json
  ];

  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      `Could not find vercel-projects.json. Tried:\n  - ${candidates.join('\n  - ')}`
    );
  }

  return JSON.parse(readFileSync(found, 'utf8')) as VercelProjectsConfig;
}

/**
 * Read Neon configuration from user's home directory
 */
export function readNeonConfig(): Partial<NeonConfig> {
  const neonCfgPath = resolve(homeDirectory, '.config', 'dayof', 'neon.json');
  try {
    return JSON.parse(readFileSync(neonCfgPath, 'utf8')) as NeonConfig;
  } catch {
    return { NEON_API_KEY: '', NEON_PROJECT_ID: '' };
  }
}

/**
 * Write Neon configuration to user's home directory
 */
export function writeNeonConfig(config: NeonConfig): void {
  const configDirectory = resolve(homeDirectory, '.config', 'dayof');
  const neonFile = resolve(configDirectory, 'neon.json');

  if (!existsSync(configDirectory)) {
    mkdirSync(configDirectory, { recursive: true });
  }

  writeFileSync(neonFile, JSON.stringify(config, null, 2));
}

/**
 * Get the path to the Neon config file
 */
export function getNeonConfigPath(): string {
  return resolve(homeDirectory, '.config', 'dayof', 'neon.json');
}
