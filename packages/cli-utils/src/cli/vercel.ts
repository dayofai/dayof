#!/usr/bin/env bun

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { readVercelConfig } from '../config';
import { readEnvVarFromFile, upsertEnvVar } from '../env';
import { CliError, handleError } from '../errors';

const VERCEL_CACHE_DIR = join(homedir(), '.config', 'dayof');
const VERCEL_SCOPE_FILE = join(VERCEL_CACHE_DIR, 'vercel-scope.txt');

function getVercelScope(): string | null {
  // Check if scope file exists
  if (existsSync(VERCEL_SCOPE_FILE)) {
    return readFileSync(VERCEL_SCOPE_FILE, 'utf-8').trim();
  }
  return null;
}

// Ensure we have a Vercel team scope set; if not, set it from config (defaults to 'dayof')
async function ensureScope(): Promise<string> {
  const existing = getVercelScope();
  if (existing) {
    return existing;
  }

  const cfg = readVercelConfig();
  const teamSlug = cfg.team || 'dayof';

  await setScope(teamSlug);
  const after = getVercelScope();
  if (!after) {
    throw new CliError(
      `Unable to set Vercel scope automatically for team '${teamSlug}'.`,
      'NO_SCOPE'
    );
  }
  return after;
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
      throw new CliError(`Unknown environment: ${env}`, 'INVALID_ENV');
  }
}

async function linkProject(appDir: string, projectName: string): Promise<void> {
  const projectJsonPath = resolve(appDir, '.vercel', 'project.json');
  if (existsSync(projectJsonPath)) {
    try {
      const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf-8'));
      if (projectJson.projectId || projectJson.orgId) {
        return;
      }
    } catch {
      // invalid/empty project.json - continue to link
    }
  }

  const scope = await ensureScope();

  return new Promise((resolvePromise, rejectPromise) => {
    const vercel = spawn(
      'bunx',
      ['vercel', 'link', '--yes', '--project', projectName],
      {
        cwd: appDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          VERCEL_ORG_ID: scope,
          VERCEL_SCOPE: scope,
        },
      }
    );

    vercel.on('close', (code) => {
      if (code !== 0) {
        rejectPromise(
          new CliError(`Failed to link project in ${appDir}`, 'LINK_FAILED')
        );
      } else {
        resolvePromise();
      }
    });

    vercel.on('error', (err) => {
      rejectPromise(
        new CliError(
          `Failed to spawn vercel command: ${err.message}`,
          'SPAWN_ERROR'
        )
      );
    });
  });
}

async function pullEnv(
  appDir: string,
  projectName: string,
  environment: string,
  gitBranch?: string
): Promise<void> {
  console.log(
    `\n📥 Pulling environment variables for ${projectName} (${environment})...`
  );

  const scope = await ensureScope();

  const args = [
    'env',
    'pull',
    fileForEnv(environment),
    `--environment=${environment}`,
    '--yes',
  ] as string[];

  if (gitBranch && environment === 'preview') {
    args.push(`--git-branch=${gitBranch}`);
  }

  return new Promise((resolvePromise, rejectPromise) => {
    const vercel = spawn('bunx', ['vercel', ...args], {
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        VERCEL_ORG_ID: scope,
        VERCEL_SCOPE: scope,
      },
    });

    vercel.on('close', (code) => {
      if (code !== 0) {
        rejectPromise(
          new CliError(`Failed to pull env for ${projectName}`, 'PULL_FAILED')
        );
      } else {
        console.log(`✅ Environment variables pulled for ${projectName}`);
        resolvePromise();
      }
    });

    vercel.on('error', (err) => {
      rejectPromise(
        new CliError(
          `Failed to spawn vercel command: ${err.message}`,
          'SPAWN_ERROR'
        )
      );
    });
  });
}

async function addEnvVar(key: string, value: string): Promise<void> {
  console.log(`\n🔧 Adding environment variable ${key}...`);

  const scope = await ensureScope();

  const projects = readVercelConfig();

  const promises = Object.entries(projects.apps).map(([, projectName]) => {
    console.log(`  Adding to ${projectName}...`);

    return new Promise<void>((resolvePromise, rejectPromise) => {
      const vercel = spawn(
        'bunx',
        ['vercel', 'env', 'add', key, 'development'],
        {
          stdio: ['pipe', 'inherit', 'inherit'],
          env: {
            ...process.env,
            VERCEL_ORG_ID: scope,
            VERCEL_SCOPE: scope,
          },
        }
      );

      // Write the value to stdin
      vercel.stdin?.write(value);
      vercel.stdin?.end();

      vercel.on('close', (code) => {
        if (code !== 0) {
          rejectPromise(
            new CliError(
              `Failed to add env var to ${projectName}`,
              'ADD_FAILED'
            )
          );
        } else {
          console.log(`  ✅ Added to ${projectName}`);
          resolvePromise();
        }
      });

      vercel.on('error', (err) => {
        rejectPromise(
          new CliError(
            `Failed to spawn vercel command: ${err.message}`,
            'SPAWN_ERROR'
          )
        );
      });
    });
  });

  await Promise.all(promises);
}

function setScope(teamSlug: string): Promise<void> {
  console.log(`\n🔧 Setting Vercel scope to team: ${teamSlug}...`);

  // Get team/org ID from Vercel
  return new Promise((resolvePromise, rejectPromise) => {
    const vercel = spawn('bunx', ['vercel', 'teams', 'ls', '--json'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    vercel.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    vercel.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    vercel.on('close', (code) => {
      if (code !== 0) {
        rejectPromise(
          new CliError(`Failed to list teams: ${stderr}`, 'LIST_TEAMS_FAILED')
        );
        return;
      }

      try {
        const teams = JSON.parse(stdout);
        const team = teams.teams?.find(
          (t: { slug: string; id: string }) => t.slug === teamSlug
        );

        if (!team) {
          rejectPromise(
            new CliError(`Team '${teamSlug}' not found`, 'TEAM_NOT_FOUND')
          );
          return;
        }

        // Create cache directory if it doesn't exist
        if (!existsSync(VERCEL_CACHE_DIR)) {
          mkdirSync(VERCEL_CACHE_DIR, { recursive: true });
        }

        // Save the team ID
        writeFileSync(VERCEL_SCOPE_FILE, team.id);
        console.log(`✅ Vercel scope set to team: ${teamSlug} (${team.id})`);
        resolvePromise();
      } catch (error) {
        rejectPromise(
          new CliError(
            `Failed to parse teams response: ${error}`,
            'PARSE_ERROR'
          )
        );
      }
    });

    vercel.on('error', (err) => {
      rejectPromise(
        new CliError(
          `Failed to spawn vercel command: ${err.message}`,
          'SPAWN_ERROR'
        )
      );
    });
  });
}

// biome-ignore lint: command router with subcommands
async function main() {
  try {
    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        help: { type: 'boolean', short: 'h' },
      },
      strict: false,
      allowPositionals: true,
    });

    const command = positionals[0];

    if (values.help || !command) {
      console.log(`
Vercel CLI - Manage Vercel environment and projects

Usage:
  bun vercel <command> [options]

Commands:
  pull              Pull environment variables for all projects
  add <key> <value> Add an environment variable to all projects
  set-scope <team>  Set the Vercel team scope

Options:
  -h, --help        Show this help message

Examples:
  bun vercel pull
  bun vercel add STRIPE_SECRET_KEY sk_test_...
  bun vercel set-scope my-team-slug
      `);
      process.exit(0);
    }

    switch (command) {
      case 'pull': {
        const envName = (positionals[1] || 'development').toLowerCase();
        const gitBranch = positionals[2];

        const projects = readVercelConfig();
        const appsDir = resolve(process.cwd(), 'apps');

        // Pull source app first (for backfill)
        const sourceApp = projects.sourceProjectForCli;
        if (sourceApp && projects.apps[sourceApp]) {
          const sourceDir = resolve(appsDir, sourceApp);
          if (existsSync(sourceDir)) {
            await linkProject(sourceDir, projects.apps[sourceApp]);
            await pullEnv(
              sourceDir,
              projects.apps[sourceApp],
              envName,
              gitBranch
            );
          } else {
            console.warn(`⚠️  App directory not found: ${sourceDir}`);
          }
        }

        // Pull remaining apps
        const remainingApps = Object.entries(projects.apps)
          .filter(([appName]) => appName !== sourceApp)
          .map(([appName, projectName]) => {
            const appDir = resolve(appsDir, appName);
            if (!existsSync(appDir)) {
              console.warn(`⚠️  App directory not found: ${appDir}`);
              return Promise.resolve();
            }
            return linkProject(appDir, projectName).then(() =>
              pullEnv(appDir, projectName, envName, gitBranch)
            );
          });

        await Promise.all(remainingApps);

        // Backfill DATABASE_URL where neither TEMP nor DATABASE_URL exist
        if (sourceApp && projects.apps[sourceApp]) {
          const sourceEnvPath = resolve(
            appsDir,
            sourceApp,
            fileForEnv(envName)
          );
          const sharedUrl = readEnvVarFromFile(sourceEnvPath, 'DATABASE_URL');
          if (sharedUrl) {
            // apps
            for (const appName of Object.keys(projects.apps)) {
              const appEnvPath = resolve(appsDir, appName, fileForEnv(envName));
              const hasTemp = !!readEnvVarFromFile(
                appEnvPath,
                'TEMP_BRANCH_DATABASE_URL'
              );
              const hasDb = !!readEnvVarFromFile(appEnvPath, 'DATABASE_URL');
              if (!(hasTemp || hasDb)) {
                upsertEnvVar(appEnvPath, 'DATABASE_URL', sharedUrl);
              }
            }
            // root
            const rootEnvPath = resolve(process.cwd(), fileForEnv(envName));
            const rootHasTemp = !!readEnvVarFromFile(
              rootEnvPath,
              'TEMP_BRANCH_DATABASE_URL'
            );
            const rootHasDb = !!readEnvVarFromFile(rootEnvPath, 'DATABASE_URL');
            if (!(rootHasTemp || rootHasDb)) {
              upsertEnvVar(rootEnvPath, 'DATABASE_URL', sharedUrl);
            }
            // packages/database
            const dbEnvPath = resolve(
              process.cwd(),
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

        console.log('\n✅ Environment variables pulled successfully!');
        break;
      }

      case 'add': {
        const key = positionals[1];
        const value = positionals[2];

        if (!(key && value)) {
          throw new CliError(
            'Usage: bun vercel add <key> <value>',
            'INVALID_USAGE'
          );
        }

        await addEnvVar(key, value);
        console.log('\n✅ Environment variable added to all projects!');
        break;
      }

      case 'set-scope': {
        const teamSlug = positionals[1];

        if (!teamSlug) {
          throw new CliError(
            'Usage: bun vercel set-scope <team-slug>',
            'INVALID_USAGE'
          );
        }

        await setScope(teamSlug);
        break;
      }

      default:
        throw new CliError(`Unknown command: ${command}`, 'UNKNOWN_COMMAND');
    }
  } catch (error) {
    handleError(error);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
