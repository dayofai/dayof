#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const config = JSON.parse(
  readFileSync(
    resolve(process.cwd(), 'scripts', 'vercel-projects.json'),
    'utf8'
  )
) as { team: string };

const team = config.team;
const result = spawnSync('vercel', ['switch', team], { stdio: 'inherit' });
process.exit(result.status ?? 0);
