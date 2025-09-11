#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Define root directory first
const rootDirectory = resolve(process.cwd());
function loadEnvFromFile(path: string): void {
  if (!existsSync(path)) return;
  try {
    const content = readFileSync(path, 'utf8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        // Remove quotes if present
        let value = match[2];
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[match[1]] = value;
      }
    }
  } catch {
    // Ignore errors
  }
}

// Try to load from multiple locations
const envPaths = [
  '.env.local',
  '.env',
  'apps/auth/.env.local',
  'apps/events/.env.local',
];
for (const envPath of envPaths) {
  loadEnvFromFile(resolve(rootDirectory, envPath));
}

type VercelProjectsConfig = {
  team: string;
  apps: Record<string, string>;
};

type NeonCfg = { NEON_API_KEY: string; NEON_PROJECT_ID: string };

type NeonBranch = {
  id: string;
  name: string;
  parent_id?: string;
  default?: boolean;
};

type NeonEndpoint = {
  id: string;
  host: string;
  branch_id: string;
  type: 'read_only' | 'read_write';
  state?: string;
};

const TTL_REGEX = /^([0-9]+)\s*([smhd])$/i;
const NEWLINE_REGEX = /\r?\n/;

function checkNeonCredentials(): { apiKey: string; projectId: string } {
  const neon = readNeonCfg();
  const apiKey = process.env.NEON_API_KEY ?? neon.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID ?? neon.NEON_PROJECT_ID;

  if (!(apiKey && projectId)) {
    console.error('Missing NEON_API_KEY / NEON_PROJECT_ID.');
    console.error('\nSearched in:');
    console.error('  - Environment variables');
    console.error('  - ~/.config/dayof/neon.json');
    for (const envPath of envPaths) {
      const fullPath = resolve(rootDirectory, envPath);
      console.error(
        `  - ${fullPath} ${existsSync(fullPath) ? '(found)' : '(not found)'}`
      );
    }
    console.error('\nTo fix this:');
    console.error(
      '1. Run: bun env:pull:dev  (recommended - pulls from Vercel)'
    );
    console.error('2. Or run: bun secrets:neon  (saves locally only)');
    console.error(
      '\nNote: The script automatically checks multiple .env.local files.'
    );
    console.error('No manual copying needed!');
    process.exit(1);
  }

  return { apiKey, projectId };
}
const cfgPath = resolve(rootDirectory, 'scripts', 'vercel-projects.json');
const projectsCfg = JSON.parse(
  readFileSync(cfgPath, 'utf8')
) as VercelProjectsConfig;

const homeDirectory = process.env.HOME || process.env.USERPROFILE || '.';
const neonCfgPath = resolve(homeDirectory, '.config', 'dayof', 'neon.json');

function readNeonCfg(): NeonCfg {
  try {
    return JSON.parse(readFileSync(neonCfgPath, 'utf8')) as NeonCfg;
  } catch {
    return { NEON_API_KEY: '', NEON_PROJECT_ID: '' };
  }
}

function getCurrentGitBranch(): string | undefined {
  const r = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: rootDirectory,
  });
  if ((r.status ?? 0) !== 0) {
    return;
  }
  const out = String(r.stdout ?? '').trim();
  if (out === '') {
    return;
  }
  return out;
}

function parseTtl(input: string): number {
  const trimmed = input.trim();
  const match = TTL_REGEX.exec(trimmed);
  if (!match) {
    return 12 * 60 * 60 * 1000; // default 12h in ms
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 12 * 60 * 60 * 1000;
  }
}

async function neonRequest<T>(
  path: string,
  options: RequestInit & { apiKey: string }
): Promise<T> {
  const base = 'https://console.neon.tech/api/v2';
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${options.apiKey}`,
  } as Record<string, string>;
  const { apiKey: _apiKey, ...rest } = options;
  const res = await fetch(`${base}${path}`, { ...rest, headers });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const j = (await res.json()) as { message?: string; error?: unknown };
      if (j && typeof j.message === 'string') {
        message = j.message;
      }
    } catch (_err) {
      // ignore JSON parse errors
    }
    throw new Error(`Neon API error: ${message}`);
  }
  return (await res.json()) as T;
}

async function getBranches(
  projectId: string,
  apiKey: string
): Promise<NeonBranch[]> {
  const data = await neonRequest<{ branches: NeonBranch[] }>(
    `/projects/${projectId}/branches`,
    { method: 'GET', apiKey }
  );
  return data.branches ?? [];
}

function findDefaultParentBranch(
  branches: NeonBranch[]
): NeonBranch | undefined {
  const byDefault = branches.find((b) => b.default);
  if (byDefault) {
    return byDefault;
  }
  const mainBranch = branches.find((b) => b.name === 'main');
  return mainBranch ?? branches.at(0);
}

async function createBranch(
  projectId: string,
  apiKey: string,
  parentId: string,
  name: string,
  expiresAtIso?: string
): Promise<NeonBranch> {
  // Try with expires_at first, fallback without if the API rejects the field
  const payloadWithExpiry = {
    branch: { name, parent_id: parentId, expires_at: expiresAtIso },
  } as unknown;
  try {
    const created = await neonRequest<{ branch: NeonBranch }>(
      `/projects/${projectId}/branches`,
      { method: 'POST', apiKey, body: JSON.stringify(payloadWithExpiry) }
    );
    return created.branch;
  } catch {
    const payloadNoExpiry = { branch: { name, parent_id: parentId } };
    const created = await neonRequest<{ branch: NeonBranch }>(
      `/projects/${projectId}/branches`,
      { method: 'POST', apiKey, body: JSON.stringify(payloadNoExpiry) }
    );
    return created.branch;
  }
}

async function getOrCreateReadWriteEndpoint(
  projectId: string,
  apiKey: string,
  branchId: string
): Promise<NeonEndpoint> {
  // Check for existing endpoints on this branch
  const existing = await neonRequest<{ endpoints: NeonEndpoint[] }>(
    `/projects/${projectId}/endpoints?branch_id=${encodeURIComponent(branchId)}`,
    { method: 'GET', apiKey }
  );

  const existingEndpoint = existing.endpoints?.find(
    (ep) => ep.branch_id === branchId && ep.type === 'read_write'
  );

  if (existingEndpoint) {
    console.log('→ Using existing read-write endpoint');
    return existingEndpoint;
  }

  // Create new endpoint
  const payload = { endpoint: { type: 'read_write', branch_id: branchId } };
  const created = await neonRequest<{ endpoint: NeonEndpoint }>(
    `/projects/${projectId}/endpoints`,
    { method: 'POST', apiKey, body: JSON.stringify(payload) }
  );
  return created.endpoint;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

async function waitForEndpointReady(
  projectId: string,
  apiKey: string,
  endpointId: string,
  timeoutMs = 120_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const startTime = Date.now();
  // CLI UX
  console.log('→ Waiting for endpoint to become active...');

  async function poll(): Promise<void> {
    const data = await neonRequest<{ endpoint: NeonEndpoint }>(
      `/projects/${projectId}/endpoints/${endpointId}`,
      { method: 'GET', apiKey }
    );

    // Check both possible state fields
    const state = (
      data.endpoint.current_state ??
      data.endpoint.state ??
      ''
    ).toLowerCase();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    // Log progress every 10 seconds
    if (elapsed > 0 && elapsed % 10 === 0) {
      console.log(
        `  Still waiting... (${elapsed}s elapsed, current state: ${state || 'unknown'})`
      );
    }

    if (state === 'active' || state === 'idle') {
      console.log(`✓ Endpoint active after ${elapsed}s`);
      return;
    }

    if (Date.now() >= deadline) {
      throw new Error(
        `Timed out waiting for endpoint to become active (state: ${state})`
      );
    }

    await sleep(2000);
    await poll();
  }

  await poll();
}

async function getConnectionUri(
  projectId: string,
  apiKey: string,
  branchId: string,
  database = 'neondb',
  role = 'neondb_owner'
): Promise<string> {
  const data = await neonRequest<{ connection_uri: string }>(
    `/projects/${projectId}/branches/${branchId}/connection_uri?database=${encodeURIComponent(
      database
    )}&role_name=${encodeURIComponent(role)}`,
    { method: 'GET', apiKey }
  );
  return data.connection_uri;
}

function upsertEnvVar(filePath: string, name: string, value: string): void {
  const line = `${name}=${JSON.stringify(value).slice(1, -1)}`; // naive but safe for common chars
  let content = '';
  if (existsSync(filePath)) {
    content = readFileSync(filePath, 'utf8');
    const lines = content.split(NEWLINE_REGEX);
    const filtered = lines.filter(
      (l) => !l.startsWith(`${name}=`) && l.trim().length > 0
    );
    content = `${filtered.join('\n')}${filtered.length ? '\n' : ''}${line}\n`;
  } else {
    const dir = resolve(filePath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    content = `${line}\n`;
  }
  writeFileSync(filePath, content, 'utf8');
}

function writeTempUrlToEnvFiles(tempUrl: string): void {
  // apps/*/.env.local and packages/database/.env.local
  for (const dir of Object.keys(projectsCfg.apps)) {
    const envPath = resolve(rootDirectory, 'apps', dir, '.env.local');
    upsertEnvVar(envPath, 'TEMP_BRANCH_DATABASE_URL', tempUrl);
  }
  const dbEnvPath = resolve(
    rootDirectory,
    'packages',
    'database',
    '.env.local'
  );
  upsertEnvVar(dbEnvPath, 'TEMP_BRANCH_DATABASE_URL', tempUrl);
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: needed complexity
async function doCreate(): Promise<void> {
  const args = process.argv.slice(2);
  let branchName: string | undefined;
  let ttl = '12h';

  // Check for positional argument first (e.g., "create branch-name")
  if (args[1] && !args[1].startsWith('--')) {
    branchName = args[1];
    // Check if there's a TTL after the branch name
    if (args[2] && !args[2].startsWith('--')) {
      ttl = args[2];
    }
  }

  // Then check for named arguments
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--name' && args[i + 1]) {
      branchName = args[++i];
    } else if (a === '--ttl' && args[i + 1]) {
      ttl = args[++i];
    }
  }
  if (!branchName) {
    const gitBranch = getCurrentGitBranch();
    const username = process.env.USER || process.env.USERNAME || 'dev';
    const timestamp = new Date()
      .toISOString()
      .slice(0, 16)
      .replace(/[:\-T]/g, '');

    if (gitBranch) {
      // Include username and timestamp with git branch to avoid collisions
      branchName = `${username}-${gitBranch}-${timestamp}`;
    } else {
      // No git branch, just use username and timestamp
      branchName = `${username}-${timestamp}`;
    }
  }

  const { apiKey, projectId } = checkNeonCredentials();

  const branches = await getBranches(projectId, apiKey);
  const parent = findDefaultParentBranch(branches);
  if (!parent) {
    throw new Error('No parent branch found in Neon project');
  }

  const expiresAtIso = new Date(Date.now() + parseTtl(ttl)).toISOString();
  // CLI UX
  console.log(
    `→ Creating branch '${branchName}' (parent ${parent.name}, expires in ${ttl})`
  );
  const newBranch = await createBranch(
    projectId,
    apiKey,
    parent.id,
    branchName,
    expiresAtIso
  );

  // Get or create endpoint
  const endpoint = await getOrCreateReadWriteEndpoint(
    projectId,
    apiKey,
    newBranch.id
  );
  await waitForEndpointReady(projectId, apiKey, endpoint.id);

  // Construct connection URI from endpoint details
  console.log('→ Constructing connection URI...');
  let uri: string;

  // Try to get password from existing DATABASE_URL
  const existingUrl =
    process.env.DATABASE_URL ||
    readFileSync('.env.local', 'utf8').match(/DATABASE_URL="([^"]+)"/)?.[1];
  const password = existingUrl?.match(/\/\/[^:]+:([^@]+)@/)?.[1];

  if (password && endpoint.host) {
    uri = `postgresql://neondb_owner:${password}@${endpoint.host}/neondb?sslmode=require`;
    console.log('✓ Connection URI ready');
  } else {
    throw new Error(
      'Unable to construct connection URI - missing password or endpoint host'
    );
  }

  writeTempUrlToEnvFiles(uri);

  // CLI UX
  console.log('✓ Ephemeral branch ready');
  // CLI UX
  console.log(`TEMP_BRANCH_DATABASE_URL=${uri}`);
}

async function doDelete(): Promise<void> {
  const args = process.argv.slice(2);
  let name: string | undefined;

  // Check for positional argument first (e.g., "delete branch-name")
  if (args[1] && !args[1].startsWith('--')) {
    name = args[1];
  } else {
    // Otherwise look for --name flag
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--name' && args[i + 1]) {
        name = args[++i];
      }
    }
  }

  if (!name) {
    name = getCurrentGitBranch();
  }
  if (!name) {
    console.error(
      'Provide a branch name: bun db:branch:delete <branch-name> or --name <branch-name>'
    );
    process.exit(1);
  }

  const { apiKey, projectId } = checkNeonCredentials();

  const branches = await getBranches(projectId, apiKey);
  const target = branches.find((b) => b.name === name);
  if (!target) {
    console.error(`No Neon branch found named '${name}'`);
    process.exit(1);
  }

  // Prevent accidental deletion of important branches
  const protectedBranches = ['main', 'production', 'master'];
  if (protectedBranches.includes(target.name.toLowerCase())) {
    console.error(`❌ Cannot delete protected branch '${target.name}'`);
    console.error('Protected branches:', protectedBranches.join(', '));
    process.exit(1);
  }

  // Delete endpoints on this branch
  const eps = await neonRequest<{ endpoints: NeonEndpoint[] }>(
    `/projects/${projectId}/endpoints?branch_id=${encodeURIComponent(target.id)}`,
    { method: 'GET', apiKey }
  );

  // Double-check that endpoints actually belong to this branch
  const endpointsToDelete = (eps.endpoints ?? []).filter(
    (ep) => ep.branch_id === target.id
  );

  if (endpointsToDelete.length === 0) {
    console.log('→ No endpoints found for this branch');
  } else {
    console.log(`→ Found ${endpointsToDelete.length} endpoint(s) to delete`);
    await Promise.all(
      endpointsToDelete.map(async (ep) => {
        console.log(`  → Deleting endpoint ${ep.id}`);
        await neonRequest(`/projects/${projectId}/endpoints/${ep.id}`, {
          method: 'DELETE',
          apiKey,
        });
      })
    );
  }

  // Delete branch
  // CLI UX
  console.log(`→ Deleting branch '${name}'`);
  await neonRequest(`/projects/${projectId}/branches/${target.id}`, {
    method: 'DELETE',
    apiKey,
  });

  // CLI UX
  console.log('✓ Branch deleted');
}

async function main(): Promise<void> {
  const sub = process.argv[2];
  if (sub === 'create') {
    await doCreate();
  } else if (sub === 'delete') {
    await doDelete();
  } else {
    // CLI UX
    console.log('Usage:');
    console.log('  bun db:branch:new [branch-name] [ttl]');
    console.log('  bun db:branch:new --name <branch-name> --ttl <ttl>');
    console.log('  bun db:branch:delete <branch-name>');
    console.log('  bun db:branch:delete --name <branch-name>');
    console.log('\nExamples:');
    console.log('  bun db:branch:new feature-xyz 2h');
    console.log('  bun db:branch:new --ttl 30m');
    console.log('  bun db:branch:delete feature-xyz');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
