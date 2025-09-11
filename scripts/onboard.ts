#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type VercelProjectsConfig = {
  team: string;
  apps: Record<string, string>;
  sourceProjectForCli?: string;
};

const rootDirectory = resolve(process.cwd());
const configPath = resolve(rootDirectory, 'scripts', 'vercel-projects.json');
const vercelConfig = JSON.parse(
  readFileSync(configPath, 'utf8')
) as VercelProjectsConfig;
const TEAM = vercelConfig.team;

function run(
  command: string,
  args: string[],
  options: { cwd?: string } = {}
): void {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: options.cwd ?? rootDirectory,
  });
  if ((result.status ?? 0) !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed`);
  }
}

function tryRun(
  command: string,
  args: string[],
  options: { cwd?: string } = {}
): boolean {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: options.cwd ?? rootDirectory,
  });
  return (result.status ?? 0) === 0;
}

function hasVercel(): boolean {
  return tryRun('vercel', ['--version']);
}

function isLoggedIn(): boolean {
  return tryRun('vercel', ['whoami']);
}

if (!hasVercel()) {
  console.error('Vercel CLI not found. Install it first: bun add -g vercel');
  process.exit(1);
}

if (!isLoggedIn()) {
  console.error(
    'You are not logged in. Run `vercel login` in a separate terminal, then re-run onboard.'
  );
  process.exit(1);
}

// 1) Set default team scope (non-interactive) and also pass --scope everywhere
tryRun('vercel', ['switch', TEAM]);

// 2) Link: do repo-level link AND per-project links to avoid ambiguity
try {
  console.log('→ Linking via `vercel link --repo` (monorepo root)');
  run('vercel', ['link', '--repo', '--yes', '--scope', TEAM]);
  console.log('✓ Repo linked');
} catch {
  console.warn(
    '`vercel link --repo` failed; continuing with per-project linking.'
  );
}

const entries = Object.entries(vercelConfig.apps);
for (const [relativeDir, projectName] of entries) {
  const cwd = resolve(rootDirectory, 'apps', relativeDir);
  console.log(`→ Linking apps/${relativeDir} -> ${projectName}`);
  run('vercel', ['link', '--yes', '--project', projectName, '--scope', TEAM], {
    cwd,
  });
}

// 3) Pull envs for development across apps
console.log('→ Pulling Development envs across apps');
run('bun', ['scripts/vercel-env-pull.ts', 'development']);

console.log('✓ Onboarding complete.');
console.log(
  '\nNote: NEON_API_KEY and NEON_PROJECT_ID have been pulled from Vercel.'
);
console.log(
  'The neon-branch.ts script will automatically use these from .env.local files.'
);
