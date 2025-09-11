#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';

type NeonCfg = { NEON_API_KEY: string; NEON_PROJECT_ID: string };

const homeDirectory = process.env.HOME || process.env.USERPROFILE || '.';
const configDirectory = resolve(homeDirectory, '.config', 'dayof');
const neonFile = resolve(configDirectory, 'neon.json');

function readExisting(): Partial<NeonCfg> {
  try {
    return JSON.parse(readFileSync(neonFile, 'utf8')) as Partial<NeonCfg>;
  } catch {
    return {};
  }
}

function ask(prompt: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolveAnswer) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolveAnswer(answer.trim());
    });
  });
}

async function main(): Promise<void> {
  if (!existsSync(configDirectory)) {
    mkdirSync(configDirectory, { recursive: true });
  }

  const current = readExisting();
  let apiKey = current.NEON_API_KEY;
  let projectId = current.NEON_PROJECT_ID;

  if (!apiKey) {
    console.log(
      'Your NEON_API_KEY is stored locally and not shared via Vercel.'
    );
    apiKey = await ask('Enter NEON_API_KEY: ');
  }

  if (!projectId) {
    projectId = await ask(
      'Enter NEON_PROJECT_ID (e.g., prj_xxx from Neon Console): '
    );
  }

  const out: NeonCfg = {
    NEON_API_KEY: apiKey ?? '',
    NEON_PROJECT_ID: projectId ?? '',
  };
  writeFileSync(neonFile, JSON.stringify(out, null, 2));
  console.log(`✓ Saved to ${neonFile}`);
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
