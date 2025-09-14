#!/usr/bin/env bun
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import {
  assert,
  execInteractive,
  execWithStdin,
  getNeonConfigPath,
  handleError,
  readEnvVarFromFile,
  readNeonConfig,
  readVercelConfig,
  upsertEnvVar,
  vercelCommand,
} from '@dayof/cli-utils';

const rootDirectory = resolve(process.cwd());
const cfg = readVercelConfig(rootDirectory);
const TEAM = cfg.team;

// Utilities
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

  const success = vercelCommand(['link', '--yes', '--project', projectName], {
    cwd: appDir,
    team: TEAM,
  });
  assert(success, `Failed to link project in ${appDir}`);
}

// Commands
function envPull(args: string[]): void {
  const environment = (args[0] || 'development').toLowerCase();
  const gitBranch = args[1];

  console.log(
    `Pulling ${environment} envs${gitBranch ? ` for ${gitBranch}` : ''}...`
  );

  // Pull source app first so we can backfill from it
  const sourceApp = cfg.sourceProjectForCli;
  if (sourceApp && cfg.apps[sourceApp]) {
    const sourceDir = resolve(rootDirectory, 'apps', sourceApp);
    console.log(`→ ${sourceApp} (source)`);
    linkProject(sourceDir, cfg.apps[sourceApp]);

    const file = fileForEnv(environment);
    const pullArgs = [
      'env',
      'pull',
      file,
      `--environment=${environment}`,
      '--yes',
    ];
    if (gitBranch && environment === 'preview') {
      pullArgs.push(`--git-branch=${gitBranch}`);
    }
    const success = vercelCommand(pullArgs, { cwd: sourceDir, team: TEAM });
    assert(success, `Failed to pull envs for ${sourceApp}`);
  }

  for (const [dir, projectName] of Object.entries(cfg.apps)) {
    if (dir !== sourceApp) {
      const appDir = resolve(rootDirectory, 'apps', dir);
      console.log(`→ ${dir}`);
      linkProject(appDir, projectName);

      const file = fileForEnv(environment);
      const pullArgs = [
        'env',
        'pull',
        file,
        `--environment=${environment}`,
        '--yes',
      ];
      if (gitBranch && environment === 'preview') {
        pullArgs.push(`--git-branch=${gitBranch}`);
      }
      const success = vercelCommand(pullArgs, { cwd: appDir, team: TEAM });
      assert(success, `Failed to pull envs for ${dir}`);
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
}

async function envAdd(args: string[]): Promise<void> {
  const NAME = args[0];
  const VALUE = args[1] ?? '';
  const ENV = (args[2] || 'development').toLowerCase();

  assert(
    NAME && VALUE !== undefined,
    'Usage: bun vercel env:add <NAME> <VALUE> [development|preview|production]'
  );

  console.log(`→ Adding ${NAME} to all projects (${ENV})...`);

  for (const [dir, projectName] of Object.entries(cfg.apps)) {
    const appDir = resolve(rootDirectory, 'apps', dir);
    console.log(`  → ${projectName}`);

    // Use stdin to safely pass the value
    const success = await execWithStdin(
      'vercel',
      ['env', 'add', NAME, ENV, '--scope', TEAM],
      VALUE,
      { cwd: appDir }
    );

    if (!success) {
      console.error(`  ✗ Failed to add to ${projectName}`);
    }
  }
  console.log('✓ Done');
}

async function setupNeon(): Promise<void> {
  console.log(
    'This will add NEON_API_KEY and NEON_PROJECT_ID to Vercel for all apps.'
  );
  console.log(
    'The values will be stored as Development environment variables.\n'
  );

  // Check for existing local config
  const existing = readNeonConfig();
  let apiKey = existing.NEON_API_KEY;
  let projectId = existing.NEON_PROJECT_ID;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (prompt: string): Promise<string> =>
    new Promise((resolveAnswer) => {
      rl.question(prompt, (answer) => {
        resolveAnswer(answer.trim());
      });
    });

  // Prompt for values if not found
  if (apiKey) {
    console.log(`Using existing NEON_API_KEY from ${getNeonConfigPath()}`);
  } else {
    apiKey = await ask('Enter NEON_API_KEY: ');
  }

  if (projectId) {
    console.log(`Using existing NEON_PROJECT_ID from ${getNeonConfigPath()}`);
  } else {
    projectId = await ask('Enter NEON_PROJECT_ID (e.g., prj_xxx): ');
  }

  rl.close();

  assert(
    apiKey && projectId,
    'Both NEON_API_KEY and NEON_PROJECT_ID are required.'
  );

  // Add to Vercel
  console.log('\n→ Adding NEON_API_KEY to all projects (development)...');
  for (const [dir, projectName] of Object.entries(cfg.apps)) {
    const appDir = resolve(rootDirectory, 'apps', dir);
    console.log(`  → ${projectName}`);

    const success = await execWithStdin(
      'vercel',
      ['env', 'add', 'NEON_API_KEY', 'development', '--scope', TEAM],
      apiKey,
      { cwd: appDir }
    );

    if (!success) {
      console.error(`  ✗ Failed to add to ${projectName}`);
    }
  }

  console.log('\n→ Adding NEON_PROJECT_ID to all projects (development)...');
  for (const [dir, projectName] of Object.entries(cfg.apps)) {
    const appDir = resolve(rootDirectory, 'apps', dir);
    console.log(`  → ${projectName}`);

    const success = await execWithStdin(
      'vercel',
      ['env', 'add', 'NEON_PROJECT_ID', 'development', '--scope', TEAM],
      projectId,
      { cwd: appDir }
    );

    if (!success) {
      console.error(`  ✗ Failed to add to ${projectName}`);
    }
  }

  console.log('\n✓ Done! Run `bun vercel pull` to pull these values locally.');
  console.log('Note: NEON_API_KEY is sensitive and should be kept secret.');
}

async function setScope(): Promise<void> {
  const success = execInteractive('vercel', ['switch', TEAM]);
  assert(success, `Failed to switch to team ${TEAM}`);
}

function onboard(): void {
  // Check Vercel CLI
  const hasVercel = execInteractive('vercel', ['--version']);
  assert(
    hasVercel,
    'Vercel CLI not found. Install it first: bun add -g vercel'
  );

  // Check login
  const isLoggedIn = execInteractive('vercel', ['whoami']);
  assert(
    isLoggedIn,
    'You are not logged in. Run `vercel login` in a separate terminal, then re-run onboard.'
  );

  // Set default team scope
  execInteractive('vercel', ['switch', TEAM]);

  // Link repo-level and per-project
  try {
    console.log('→ Linking via `vercel link --repo` (monorepo root)');
    vercelCommand(['link', '--repo', '--yes'], { team: TEAM });
    console.log('✓ Repo linked');
  } catch {
    console.warn(
      '`vercel link --repo` failed; continuing with per-project linking.'
    );
  }

  for (const [relativeDir, projectName] of Object.entries(cfg.apps)) {
    const cwd = resolve(rootDirectory, 'apps', relativeDir);
    console.log(`→ Linking apps/${relativeDir} -> ${projectName}`);
    vercelCommand(['link', '--yes', '--project', projectName], {
      cwd,
      team: TEAM,
    });
  }

  // Pull envs for development
  console.log('→ Pulling Development envs across apps');
  envPull(['development']);

  console.log('✓ Onboarding complete.');
  console.log(
    '\nNote: NEON_API_KEY and NEON_PROJECT_ID have been pulled from Vercel.'
  );
  console.log(
    'The neon script will automatically use these from .env.local files.'
  );
}

// Main CLI
async function main(): Promise<void> {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'pull':
    case 'env:pull':
      envPull(args);
      break;
    case 'env:add':
      await envAdd(args);
      break;
    case 'setup:neon':
      await setupNeon();
      break;
    case 'scope':
    case 'set-scope':
      await setScope();
      break;
    case 'onboard':
      onboard();
      break;
    default:
      console.log('Usage:');
      console.log('  bun vercel pull [environment] [git-branch]');
      console.log('  bun vercel env:add <NAME> <VALUE> [environment]');
      console.log('  bun vercel setup:neon');
      console.log('  bun vercel scope');
      console.log('  bun vercel onboard');
      console.log('\nExamples:');
      console.log('  bun vercel pull development');
      console.log('  bun vercel pull preview feature-branch');
      console.log('  bun vercel env:add API_KEY abc123 production');
      console.log('  bun vercel setup:neon');
      console.log('  bun vercel onboard');
      process.exit(1);
  }
}

main().catch(handleError);
