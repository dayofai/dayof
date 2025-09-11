#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type VercelProjectsConfig = {
  team: string;
  apps: Record<string, string>;
};

const rootDirectory = resolve(process.cwd());
const configPath = resolve(rootDirectory, 'scripts', 'vercel-projects.json');
const cfg = JSON.parse(
  readFileSync(configPath, 'utf8')
) as VercelProjectsConfig;
const TEAM = cfg.team;

const NAME = process.argv[2];
const VALUE = process.argv[3] ?? '';
const ENV = (process.argv[4] || 'development').toLowerCase();

if (!NAME || VALUE === undefined) {
  console.error(
    'Usage: bun scripts/vc-env-add.ts <NAME> <VALUE> [development|preview|production]'
  );
  process.exit(1);
}

function add(appDir: string): void {
  // Use bash with -lc to safely handle piping and quoting
  const cmd = `printf %s "${VALUE.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}" | vercel env add ${NAME} ${ENV} --yes --cwd "${appDir}" --scope ${TEAM}`;
  const r = spawnSync('bash', ['-lc', cmd], { stdio: 'inherit' });
  if ((r.status ?? 0) !== 0) {
    throw new Error(`env add failed in ${appDir}`);
  }
}

for (const dir of Object.keys(cfg.apps)) {
  const appDir = resolve(rootDirectory, 'apps', dir);
  console.log(`→ Adding ${NAME} to apps/${dir} (${ENV})`);
  add(appDir);
}
console.log('✓ Done.');
