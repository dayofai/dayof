#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type VercelProjectsConfig = {
  team: string;
  apps: Record<string, string>;
  sourceProjectForCli?: string;
};

const rootDirectory = resolve(process.cwd());
const configPath = resolve(rootDirectory, 'scripts', 'vercel-projects.json');
const cfg = JSON.parse(
  readFileSync(configPath, 'utf8')
) as VercelProjectsConfig;
const TEAM = cfg.team;

const environment = (process.argv[2] || 'development').toLowerCase();
const gitBranch = process.argv[3];

const NEWLINE_REGEX = /\r?\n/;

function readEnvVarFromFile(
  filePath: string,
  name: string
): string | undefined {
  if (!existsSync(filePath)) {
    return;
  }
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split(NEWLINE_REGEX);
    for (const line of lines) {
      if (!line.startsWith(`${name}=`)) {
        continue;
      }
      const raw = line.slice(name.length + 1);
      let value = raw;
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return value;
    }
    return;
  } catch {
    return;
  }
}

function upsertEnvVar(filePath: string, name: string, value: string): void {
  const line = `${name}=${JSON.stringify(value).slice(1, -1)}`;
  let content = '';
  if (existsSync(filePath)) {
    content = readFileSync(filePath, 'utf8');
    const lines = content.split(NEWLINE_REGEX);
    const filtered = lines.filter(
      (l) => !l.startsWith(`${name}=`) && l.trim().length > 0
    );
    content = `${filtered.join('\n')}${filtered.length ? '\n' : ''}${line}\n`;
  } else {
    content = `${line}\n`;
  }
  const dir = resolve(filePath, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, content, 'utf8');
}

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

// Pull source app first so we can backfill from it
const sourceApp = cfg.sourceProjectForCli;
if (sourceApp && cfg.apps[sourceApp]) {
  const sourceDir = resolve(rootDirectory, 'apps', sourceApp);
  console.log(`→ ${sourceApp} (source)`);
  linkProject(sourceDir, cfg.apps[sourceApp]);
  pull(sourceDir);
}

for (const [dir, projectName] of Object.entries(cfg.apps)) {
  const appDir = resolve(rootDirectory, 'apps', dir);
  if (dir !== sourceApp) {
    console.log(`→ ${dir}`);
    linkProject(appDir, projectName);
    pull(appDir);
  }
}

// Backfill DATABASE_URL where neither TEMP nor DATABASE_URL exist
if (sourceApp && cfg.apps[sourceApp]) {
  const sourceEnvPath = resolve(
    rootDirectory,
    'apps',
    sourceApp,
    fileForEnv(environment)
  );
  const sharedUrl = readEnvVarFromFile(sourceEnvPath, 'DATABASE_URL');
  if (sharedUrl) {
    for (const dir of Object.keys(cfg.apps)) {
      const appEnvPath = resolve(
        rootDirectory,
        'apps',
        dir,
        fileForEnv(environment)
      );
      const hasTemp = !!readEnvVarFromFile(
        appEnvPath,
        'TEMP_BRANCH_DATABASE_URL'
      );
      const hasDb = !!readEnvVarFromFile(appEnvPath, 'DATABASE_URL');
      if (!(hasTemp || hasDb)) {
        upsertEnvVar(appEnvPath, 'DATABASE_URL', sharedUrl);
      }
    }
    // Also ensure root .env.local has DATABASE_URL if neither exist
    const rootEnvPath = resolve(rootDirectory, fileForEnv(environment));
    const rootHasTemp = !!readEnvVarFromFile(
      rootEnvPath,
      'TEMP_BRANCH_DATABASE_URL'
    );
    const rootHasDb = !!readEnvVarFromFile(rootEnvPath, 'DATABASE_URL');
    if (!(rootHasTemp || rootHasDb)) {
      upsertEnvVar(rootEnvPath, 'DATABASE_URL', sharedUrl);
    }
    // Ensure packages/database/.env.local has DATABASE_URL if neither exist
    const dbEnvPath = resolve(
      rootDirectory,
      'packages',
      'database',
      '.env.local'
    );
    const dbHasTemp = !!readEnvVarFromFile(
      dbEnvPath,
      'TEMP_BRANCH_DATABASE_URL'
    );
    const dbHasDb = !!readEnvVarFromFile(dbEnvPath, 'DATABASE_URL');
    if (!(dbHasTemp || dbHasDb)) {
      upsertEnvVar(dbEnvPath, 'DATABASE_URL', sharedUrl);
    }
  }
}
console.log('✓ Done');
