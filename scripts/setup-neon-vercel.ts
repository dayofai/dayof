#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import readline from 'node:readline';

type VercelProjectsConfig = {
  team: string;
  apps: Record<string, string>;
};

type NeonCfg = { NEON_API_KEY: string; NEON_PROJECT_ID: string };

const rootDirectory = resolve(process.cwd());
const configPath = resolve(rootDirectory, 'scripts', 'vercel-projects.json');
const cfg = JSON.parse(
  readFileSync(configPath, 'utf8')
) as VercelProjectsConfig;
const TEAM = cfg.team;

const homeDirectory = process.env.HOME || process.env.USERPROFILE || '.';
const neonCfgPath = resolve(homeDirectory, '.config', 'dayof', 'neon.json');

function readExisting(): Partial<NeonCfg> {
  try {
    return JSON.parse(readFileSync(neonCfgPath, 'utf8')) as Partial<NeonCfg>;
  } catch {
    return {};
  }
}

function ask(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolveAnswer) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolveAnswer(answer.trim());
    });
  });
}

function addEnvVar(name: string, value: string, env = 'development'): void {
  console.log(`\n→ Adding ${name} to all projects (${env})...`);

  for (const [dir, projectName] of Object.entries(cfg.apps)) {
    const appDir = resolve(rootDirectory, 'apps', dir);
    console.log(`  → ${projectName}`);

    // Use printf to safely handle the value
    const cmd = `printf %s "${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}" | vercel env add ${name} ${env} --cwd "${appDir}" --scope ${TEAM}`;
    const r = spawnSync('bash', ['-c', cmd], { stdio: 'inherit' });
    if ((r.status ?? 0) !== 0) {
      console.error(`  ✗ Failed to add to ${projectName}`);
    }
  }
}

async function main(): Promise<void> {
  console.log(
    'This will add NEON_API_KEY and NEON_PROJECT_ID to Vercel for all apps.'
  );
  console.log(
    'The values will be stored as Development environment variables.\n'
  );

  // Check for existing local config
  const existing = readExisting();
  let apiKey = existing.NEON_API_KEY;
  let projectId = existing.NEON_PROJECT_ID;

  // Prompt for values if not found
  if (apiKey) {
    console.log(`Using existing NEON_API_KEY from ${neonCfgPath}`);
  } else {
    apiKey = await ask('Enter NEON_API_KEY: ');
  }

  if (projectId) {
    console.log(`Using existing NEON_PROJECT_ID from ${neonCfgPath}`);
  } else {
    projectId = await ask('Enter NEON_PROJECT_ID (e.g., prj_xxx): ');
  }

  if (!(apiKey && projectId)) {
    console.error(
      '\nError: Both NEON_API_KEY and NEON_PROJECT_ID are required.'
    );
    process.exit(1);
  }

  // Add to Vercel
  addEnvVar('NEON_API_KEY', apiKey);
  addEnvVar('NEON_PROJECT_ID', projectId);

  console.log('\n✓ Done! Run `bun env:pull:dev` to pull these values locally.');
  console.log('Note: NEON_API_KEY is sensitive and should be kept secret.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
