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
  // Go up from src/config.ts to package root
  return resolve(__dirname, '..', '..');
}

/**
 * Read Vercel projects configuration
 */
export function readVercelConfig(): VercelProjectsConfig {
  const packageRoot = getPackageRoot();

  // First try the package directory (where we moved it)
  let cfgPath = resolve(packageRoot, 'vercel-projects.json');
  if (!existsSync(cfgPath)) {
    // Fall back to project root scripts directory (legacy location)
    const projectRoot = resolve(packageRoot, '..', '..');
    cfgPath = resolve(projectRoot, 'scripts', 'vercel-projects.json');
  }

  if (!existsSync(cfgPath)) {
    throw new Error(`Could not find vercel-projects.json at ${cfgPath}`);
  }

  return JSON.parse(readFileSync(cfgPath, 'utf8')) as VercelProjectsConfig;
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
