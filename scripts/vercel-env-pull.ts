#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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

const environment = (process.argv[2] || 'development').toLowerCase();
const gitBranch = process.argv[3];

function fileForEnv(env: string): string {
  switch (env) {
    case 'development':
      return '.env.local';
    case 'preview':
      return '.env.preview.local';
    case 'production':
      return '.env.production.local';
    default:
      throw new Error(`Unknown environment: ${env}`);
  }
}

function pull(appDir: string): void {
  const file = fileForEnv(environment);
  const args = [
    'env',
    'pull',
    file,
    `--environment=${environment}`,
    '--yes',
    '--scope',
    TEAM,
    '--cwd',
    appDir,
  ];
  if (gitBranch && environment === 'preview') {
    args.push(`--git-branch=${gitBranch}`);
  }
  const r = spawnSync('vercel', args, { stdio: 'inherit' });
  if ((r.status ?? 0) !== 0) {
    throw new Error(`vercel env pull failed in ${appDir}`);
  }
}

function linkProject(appDir: string, projectName: string): void {
  // Check if already linked
  const projectJsonPath = resolve(appDir, '.vercel', 'project.json');
  if (existsSync(projectJsonPath)) {
    try {
      const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf8'));
      // If already linked to correct project, skip
      if (projectJson.projectId || projectJson.orgId) {
        return;
      }
    } catch {
      // Invalid project.json, re-link
    }
  }

  const r = spawnSync(
    'vercel',
    [
      'link',
      '--yes',
      '--project',
      projectName,
      '--scope',
      TEAM,
      '--cwd',
      appDir,
    ],
    { stdio: 'inherit' }
  );
  if ((r.status ?? 0) !== 0) {
    throw new Error(`vercel link failed in ${appDir}`);
  }
}

console.log(
  `Pulling ${environment} envs${gitBranch ? ` for ${gitBranch}` : ''}...`
);
for (const [dir, projectName] of Object.entries(cfg.apps)) {
  const appDir = resolve(rootDirectory, 'apps', dir);
  console.log(`→ ${dir}`);
  linkProject(appDir, projectName);
  pull(appDir);
}
console.log('✓ Done');
