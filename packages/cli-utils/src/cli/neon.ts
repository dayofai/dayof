#!/usr/bin/env bun
import {
  existsSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { URL } from 'node:url';
import {
  getNeonConfigPath,
  readNeonConfig,
  readVercelConfig,
  writeNeonConfig,
} from '../config';
import { readEnvVarFromFile, removeEnvVar, upsertEnvVar } from '../env';
import { assert, CliError, handleError } from '../errors';

interface NeonBranch {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  default?: boolean;
}

interface NeonEndpoint {
  id: string;
  branch_id: string;
  type: string;
  host?: string;
  autoscaling_limit_min_cu: number;
  autoscaling_limit_max_cu: number;
}

interface LastBranchInfo {
  name: string;
  id: string;
  timestamp: string;
  projectId: string;
}

const TTL_REGEX = /^(\d+)\s*([smhd])$/i;

/**
 * Get Neon credentials from environment or config
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: gathers env and config inputs synchronously
function getNeonCredentials(): {
  apiKey: string;
  projectId: string;
} {
  // First check environment variables
  let apiKey = process.env.NEON_API_KEY;
  let projectId = process.env.NEON_PROJECT_ID;

  if (apiKey && projectId) {
    return { apiKey, projectId };
  }

  // Check .env.local in root
  const rootEnvPath = resolve(process.cwd(), '.env.local');
  if (!apiKey) {
    apiKey = readEnvVarFromFile(rootEnvPath, 'NEON_API_KEY');
  }
  if (!projectId) {
    projectId = readEnvVarFromFile(rootEnvPath, 'NEON_PROJECT_ID');
  }

  if (apiKey && projectId) {
    return { apiKey, projectId };
  }

  // Check any app's .env.local files (they're pulled from Vercel shared envs)
  const appsDir = resolve(process.cwd(), 'apps');
  if (existsSync(appsDir)) {
    const appDirs = readdirSync(appsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const appDir of appDirs) {
      const appEnvPath = resolve(appsDir, appDir, '.env.local');
      if (existsSync(appEnvPath)) {
        if (!apiKey) {
          const foundKey = readEnvVarFromFile(appEnvPath, 'NEON_API_KEY');
          if (foundKey) {
            apiKey = foundKey;
          }
        }
        if (!projectId) {
          const foundId = readEnvVarFromFile(appEnvPath, 'NEON_PROJECT_ID');
          if (foundId) {
            projectId = foundId;
          }
        }
        if (apiKey && projectId) {
          return { apiKey, projectId };
        }
      }
    }
  }

  // Check config file as last resort
  const config = readNeonConfig();
  if (!apiKey && config.NEON_API_KEY) {
    apiKey = config.NEON_API_KEY;
  }
  if (!projectId && config.NEON_PROJECT_ID) {
    projectId = config.NEON_PROJECT_ID;
  }

  if (!(apiKey && projectId)) {
    throw new CliError(
      'NEON_API_KEY and NEON_PROJECT_ID not found.\n\n' +
        "These credentials should be in your apps' .env.local files from Vercel.\n" +
        "Run 'bun vercel pull' to fetch them from Vercel, or\n" +
        "Run 'bun neon setup' to configure them manually."
    );
  }

  return { apiKey, projectId };
}

/**
 * Make authenticated request to Neon API
 */
async function neonRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { apiKey } = getNeonCredentials();

  const response = await fetch(`https://console.neon.tech/api/v2${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new CliError(`Neon API error: ${response.status} - ${error}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}

/**
 * Reset a role's password on a specific branch via Neon API.
 * Returns the newly generated password.
 */
async function resetBranchRolePassword(
  projectId: string,
  branchId: string,
  roleName: string
): Promise<string> {
  const res = await neonRequest<{
    role?: { password?: string };
    password?: string;
    operations?: Array<{ id: string; status?: string }>;
  }>(
    `/projects/${projectId}/branches/${encodeURIComponent(
      branchId
    )}/roles/${encodeURIComponent(roleName)}/reset_password`,
    { method: 'POST' } as RequestInit
  );

  const password = res?.role?.password ?? res?.password;
  assert(
    typeof password === 'string' && password.length > 0,
    'Neon API did not return a password when resetting role password'
  );

  const opIds = (res.operations ?? [])
    .map((o) => o?.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  const pollOperation = (operationId: string): Promise<void> => {
    const deadline = Date.now() + 30_000;
    // biome-ignore lint/nursery/noShadow: don't care right now
    return new Promise((resolve, reject) => {
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: don't care right now
      const tick = async (): Promise<void> => {
        try {
          const { operation } = await neonRequest<{
            operation: { status?: string };
          }>(
            `/projects/${projectId}/operations/${encodeURIComponent(operationId)}`,
            {
              method: 'GET',
            } as RequestInit
          );
          const status = (operation?.status ?? '').toLowerCase();
          if (status && status !== 'running' && status !== 'queued') {
            const ok = new Set([
              'succeeded',
              'ready',
              'finished',
              'completed',
              'success',
              'applied',
            ]);
            if (!ok.has(status)) {
              reject(
                new CliError(
                  `Password reset operation did not succeed (status: ${status})`
                )
              );
              return;
            }
            resolve();
            return;
          }
          if (Date.now() > deadline) {
            reject(
              new CliError('Timed out waiting for Neon to apply password reset')
            );
            return;
          }
          setTimeout(tick, 1000);
        } catch (err) {
          reject(err as Error);
        }
      };
      // Start the polling loop
      tick().catch(reject);
    });
  };

  if (opIds.length > 0) {
    await Promise.all(opIds.map((id) => pollOperation(id)));
  }

  return password as string;
}

/**
 * Parse TTL string to seconds
 */
function parseTTL(ttl: string): number {
  const match = TTL_REGEX.exec(ttl);
  if (!match) {
    return 12 * 60 * 60 * 1000; // default 12h in ms
  }
  const value = Number.parseInt(match[1], 10);
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

/**
 * Save last branch info
 */
function saveLastBranch(info: LastBranchInfo): void {
  const filePath = resolve(process.cwd(), '.neon-last-branch');
  writeFileSync(filePath, JSON.stringify(info, null, 2));
}

/**
 * Get last branch info
 */
function getLastBranch(): LastBranchInfo | null {
  const filePath = resolve(process.cwd(), '.neon-last-branch');
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Delete last branch info file
 */
function deleteLastBranchFile(): void {
  const filePath = resolve(process.cwd(), '.neon-last-branch');
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

/**
 * Create a new Neon branch
 */
// biome-ignore lint: CLI command contains branching for UX
async function branchCreate(args: string[]): Promise<void> {
  // Parse arguments - support both positional and named
  let branchName: string | undefined;
  let ttl = '12h'; // legacy default

  // Check for named arguments first
  const nameIndex = args.indexOf('--name');
  const ttlIndex = args.indexOf('--ttl');

  if (nameIndex >= 0 && args[nameIndex + 1]) {
    branchName = args[nameIndex + 1];
  } else if (args[0] && !args[0].startsWith('--')) {
    branchName = args[0];
    if (args[1] && !args[1].startsWith('--')) {
      ttl = args[1];
    }
  }

  if (ttlIndex >= 0 && args[ttlIndex + 1]) {
    ttl = args[ttlIndex + 1];
  }

  // Generate branch name if not provided
  if (!branchName) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    branchName = `temp-${timestamp}`;
    console.log(`→ Using generated branch name: ${branchName}`);
  }

  const { projectId } = await getNeonCredentials();

  // Discover parent branch (default -> main -> first)
  const branchesRes = await neonRequest<{ branches: NeonBranch[] }>(
    `/projects/${projectId}/branches`,
    { method: 'GET' } as RequestInit
  );
  const branches = branchesRes.branches ?? [];
  const parent =
    branches.find((b) => b.default) ??
    branches.find((b) => b.name === 'main') ??
    branches[0];
  assert(parent, 'Could not find parent branch');

  const expiresAtIso = new Date(Date.now() + parseTTL(ttl)).toISOString();
  console.log(
    `→ Creating branch '${branchName}' (parent ${parent.name}, expires in ${ttl})`
  );

  // Create branch with expires_at fallback
  let newBranch: NeonBranch;
  try {
    const created = await neonRequest<{ branch: NeonBranch }>(
      `/projects/${projectId}/branches`,
      {
        method: 'POST',
        body: JSON.stringify({
          branch: {
            name: branchName,
            parent_id: parent.id,
            expires_at: expiresAtIso,
          },
        }),
      } as RequestInit
    );
    newBranch = created.branch;
  } catch {
    const created = await neonRequest<{ branch: NeonBranch }>(
      `/projects/${projectId}/branches`,
      {
        method: 'POST',
        body: JSON.stringify({
          branch: { name: branchName, parent_id: parent.id },
        }),
      } as RequestInit
    );
    newBranch = created.branch;
  }
  console.log(`✓ Branch created: ${newBranch.id}`);

  // Ensure a read-write endpoint exists
  const eps = await neonRequest<{ endpoints: NeonEndpoint[] }>(
    `/projects/${projectId}/endpoints?branch_id=${encodeURIComponent(newBranch.id)}`,
    { method: 'GET' } as RequestInit
  );
  let endpoint = (eps.endpoints ?? []).find(
    (ep) => ep.branch_id === newBranch.id && ep.type === 'read_write'
  );

  if (!endpoint) {
    console.log('→ Creating read-write endpoint...');
    const createdEp = await neonRequest<{ endpoint: NeonEndpoint }>(
      `/projects/${projectId}/endpoints`,
      {
        method: 'POST',
        body: JSON.stringify({
          endpoint: { type: 'read_write', branch_id: newBranch.id },
        }),
      } as RequestInit
    );
    endpoint = createdEp.endpoint;
  }

  // Wait for endpoint readiness
  console.log('→ Waiting for endpoint to become active...');
  const start = Date.now();
  const timeoutMs = 120_000;
  while (true) {
    // biome-ignore lint: allow await inside polling loop
    const epRes = await neonRequest<{
      endpoint: Partial<NeonEndpoint> & {
        current_state?: string;
        state?: string;
      };
    }>(`/projects/${projectId}/endpoints/${endpoint.id}`, {
      method: 'GET',
    } as RequestInit);
    const state = (
      epRes.endpoint?.current_state ??
      epRes.endpoint?.state ??
      ''
    ).toLowerCase();
    const elapsed = Math.floor((Date.now() - start) / 1000);
    if (state === 'active' || state === 'idle') {
      console.log(`✓ Endpoint active after ${elapsed}s`);
      break;
    }
    if (Date.now() - start > timeoutMs) {
      throw new CliError(
        `Timed out waiting for endpoint to become active (state: ${state})`
      );
    }
    if (elapsed > 0 && elapsed % 10 === 0) {
      console.log(
        `  Still waiting... (${elapsed}s elapsed, current state: ${state || 'unknown'})`
      );
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Construct connection URI by preserving username, password, db name, and params
  console.log('→ Constructing connection URI...');
  const rootEnvPath = resolve(process.cwd(), '.env.local');
  const existingUrl =
    process.env.DATABASE_URL || readEnvVarFromFile(rootEnvPath, 'DATABASE_URL');
  assert(
    existingUrl && endpoint.host,
    'Unable to construct connection URI - missing existing DATABASE_URL or endpoint host'
  );

  let parsed: URL;
  try {
    parsed = new URL(existingUrl as string);
  } catch {
    throw new CliError('Invalid DATABASE_URL format');
  }

  const username = parsed.username;
  const password = parsed.password;
  const dbPath = parsed.pathname || '/neondb';
  const protocol = parsed.protocol || 'postgresql:';

  // Build new URL pointing to the new endpoint host while preserving creds and db
  const newUrl = new URL(
    `${protocol}//${username}:${password}@${endpoint.host}${dbPath}${parsed.search ?? ''}`
  );
  const params = new URLSearchParams(newUrl.search);
  if (!params.has('sslmode')) {
    params.set('sslmode', 'require');
  }
  newUrl.search = params.toString() ? `?${params.toString()}` : '';

  // Reset branch-local password to an ephemeral secret to guarantee connectivity
  let connectionUri = newUrl.toString();
  const role = username || 'neondb_owner';
  console.log(
    '→ Resetting branch-local password for role to ephemeral value...'
  );
  const newPassword = await resetBranchRolePassword(
    projectId,
    newBranch.id,
    role
  );
  // Rebuild connection URI with the API-returned password
  newUrl.password = newPassword;
  connectionUri = newUrl.toString();
  console.log('✓ Ephemeral password set for temp branch');

  console.log('✓ Connection URI ready');

  // Propagate to env files across apps and packages/database
  const cfg = readVercelConfig();
  for (const dir of Object.keys(cfg.apps)) {
    const envPath = resolve(process.cwd(), 'apps', dir, '.env.local');
    upsertEnvVar(envPath, 'TEMP_BRANCH_DATABASE_URL', connectionUri);
  }
  const dbEnvPath = resolve(
    process.cwd(),
    'packages',
    'database',
    '.env.local'
  );
  upsertEnvVar(dbEnvPath, 'TEMP_BRANCH_DATABASE_URL', connectionUri);

  // Save branch info for easy deletion
  saveLastBranch({
    name: branchName,
    id: newBranch.id,
    timestamp: new Date().toISOString(),
    projectId,
  });

  console.log('\n✓ Ephemeral branch ready');
  console.log('✓ Branch info saved to .neon-last-branch');
  console.log(`TEMP_BRANCH_DATABASE_URL=${connectionUri}`);
}

/**
 * Delete a Neon branch
 */
// biome-ignore lint: CLI command contains branching for UX
async function branchDelete(args: string[]): Promise<void> {
  const { projectId } = await getNeonCredentials();

  // Parse arguments
  let branchName: string | undefined;

  // Check for named argument
  const nameIndex = args.indexOf('--name');
  if (nameIndex >= 0) {
    branchName = args[nameIndex + 1];
  } else if (args[0] && !args[0].startsWith('--')) {
    branchName = args[0];
  }

  // If no branch specified, try to use last created branch
  let target: NeonBranch | undefined;
  let isLastBranch = false;

  if (!branchName) {
    const lastBranch = getLastBranch();
    if (lastBranch && lastBranch.projectId === projectId) {
      branchName = lastBranch.name;
      isLastBranch = true;
      console.log(`→ Deleting last created branch: ${branchName}`);
    } else {
      throw new CliError(
        'No branch name specified and no last branch found.\n' +
          'Usage: bun neon branch:delete <branch-name>'
      );
    }
  }

  // Get all branches
  const { branches } = await neonRequest<{ branches: NeonBranch[] }>(
    `/projects/${projectId}/branches`,
    { method: 'GET' } as RequestInit
  );

  // Find target branch
  target = branches.find((b: NeonBranch) => b.name === branchName);
  if (!target) {
    throw new CliError(`Branch '${branchName}' not found`);
  }

  // Prevent deletion of protected branches
  const protectedBranches = ['main', 'master', 'production', 'prod'];
  if (protectedBranches.includes(target.name.toLowerCase())) {
    throw new CliError(
      `Cannot delete protected branch '${target.name}'. Protected branches: ${protectedBranches.join(', ')}`
    );
  }

  // Check for endpoints
  const { endpoints } = await neonRequest<{ endpoints: NeonEndpoint[] }>(
    `/projects/${projectId}/endpoints?branch_id=${encodeURIComponent(target.id)}`,
    { method: 'GET' } as RequestInit
  );

  // Find endpoints for this branch
  const branchEndpoints = endpoints.filter(
    (ep: NeonEndpoint) => ep.branch_id === target.id
  );

  console.log(
    `→ Deleting branch '${target.name}' (${target.id}) with ${branchEndpoints.length} endpoint(s)`
  );

  // Delete endpoints first
  if (branchEndpoints.length > 0) {
    const deletePromises = branchEndpoints.map((endpoint: NeonEndpoint) => {
      console.log(`  → Deleting endpoint ${endpoint.id}...`);
      return neonRequest(`/projects/${projectId}/endpoints/${endpoint.id}`, {
        method: 'DELETE',
      } as RequestInit);
    });
    await Promise.all(deletePromises);
  }

  // Delete branch
  await neonRequest(`/projects/${projectId}/branches/${target.id}`, {
    method: 'DELETE',
  });

  console.log(`✓ Branch '${target.name}' deleted`);

  // Clean up TEMP across all apps and packages
  const cfg = readVercelConfig();
  console.log('→ Cleaning up temporary database URLs...');
  for (const dir of Object.keys(cfg.apps)) {
    const appEnvPath = resolve(process.cwd(), 'apps', dir, '.env.local');
    removeEnvVar(appEnvPath, 'TEMP_BRANCH_DATABASE_URL');
  }
  const rootEnvPath = resolve(process.cwd(), '.env.local');
  const dbEnvPath = resolve(
    process.cwd(),
    'packages',
    'database',
    '.env.local'
  );
  removeEnvVar(rootEnvPath, 'TEMP_BRANCH_DATABASE_URL');
  removeEnvVar(dbEnvPath, 'TEMP_BRANCH_DATABASE_URL');

  // Restore shared DATABASE_URL where missing
  console.log('→ Restoring shared DATABASE_URL where missing...');
  const sourceApp = cfg.sourceProjectForCli;
  let sharedUrl: string | undefined;
  if (sourceApp && cfg.apps[sourceApp]) {
    const sourceEnvPath = resolve(
      process.cwd(),
      'apps',
      sourceApp,
      '.env.local'
    );
    sharedUrl = readEnvVarFromFile(sourceEnvPath, 'DATABASE_URL');
  }
  if (sharedUrl) {
    for (const dir of Object.keys(cfg.apps)) {
      const appEnvPath = resolve(process.cwd(), 'apps', dir, '.env.local');
      const hasTemp = !!readEnvVarFromFile(
        appEnvPath,
        'TEMP_BRANCH_DATABASE_URL'
      );
      const hasDb = !!readEnvVarFromFile(appEnvPath, 'DATABASE_URL');
      if (!(hasTemp || hasDb)) {
        upsertEnvVar(appEnvPath, 'DATABASE_URL', sharedUrl);
      }
    }
    const rootHasTemp = !!readEnvVarFromFile(
      rootEnvPath,
      'TEMP_BRANCH_DATABASE_URL'
    );
    const rootHasDb = !!readEnvVarFromFile(rootEnvPath, 'DATABASE_URL');
    if (!(rootHasTemp || rootHasDb)) {
      upsertEnvVar(rootEnvPath, 'DATABASE_URL', sharedUrl);
    }
    const dbHasTemp = !!readEnvVarFromFile(
      dbEnvPath,
      'TEMP_BRANCH_DATABASE_URL'
    );
    const dbHasDb = !!readEnvVarFromFile(dbEnvPath, 'DATABASE_URL');
    if (!(dbHasTemp || dbHasDb)) {
      upsertEnvVar(dbEnvPath, 'DATABASE_URL', sharedUrl);
    }
  }

  // Delete last branch file if this was the last branch
  if (isLastBranch) {
    deleteLastBranchFile();
    console.log('  ✓ Removed .neon-last-branch file');
  }

  console.log('\n✓ Cleanup complete');
}

/**
 * Set up local Neon configuration
 */
async function setupLocal(): Promise<void> {
  const configPath = getNeonConfigPath();
  const existing = readNeonConfig();

  console.log('Neon Local Setup');
  console.log('================');
  console.log(`Config will be saved to: ${configPath}\n`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (prompt: string, defaultValue?: string): Promise<string> =>
    new Promise((done) => {
      const promptText = defaultValue
        ? `${prompt} [${defaultValue}]: `
        : `${prompt}: `;
      rl.question(promptText, (answer) => {
        done(answer.trim() || defaultValue || '');
      });
    });

  const apiKey =
    (await ask('Enter your NEON_API_KEY', existing.NEON_API_KEY)) ||
    existing.NEON_API_KEY;
  const projectId =
    (await ask(
      'Enter your NEON_PROJECT_ID (e.g., prj_xxx)',
      existing.NEON_PROJECT_ID
    )) || existing.NEON_PROJECT_ID;

  rl.close();

  if (!(apiKey && projectId)) {
    throw new CliError('Both NEON_API_KEY and NEON_PROJECT_ID are required');
  }

  // Save config
  writeNeonConfig({ NEON_API_KEY: apiKey, NEON_PROJECT_ID: projectId });

  console.log(`\n✓ Configuration saved to ${configPath}`);
  console.log(
    '\nYou can now use Neon CLI commands without environment variables.'
  );
}

// Main CLI
async function main(): Promise<void> {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'branch:create':
    case 'branch:new':
    case 'create':
      await branchCreate(args);
      break;
    case 'branch:delete':
    case 'delete':
      await branchDelete(args);
      break;
    case 'setup':
      await setupLocal();
      break;
    default:
      console.log('Usage:');
      console.log('  bun neon branch:create [branch-name] [ttl]');
      console.log('  bun neon branch:create --name <branch-name> --ttl <ttl>');
      console.log('  bun neon branch:delete <branch-name>');
      console.log('  bun neon branch:delete --name <branch-name>');
      console.log('  bun neon branch:delete  (deletes last created branch)');
      console.log('  bun neon setup  (configure Neon credentials)');
      console.log('\nExamples:');
      console.log('  bun neon branch:create feature-xyz 2h');
      console.log('  bun neon branch:create --ttl 30m');
      console.log('  bun neon branch:delete  (deletes last created branch)');
      console.log('  bun neon branch:delete feature-xyz');
      console.log(
        '\nNote: Branch names are saved to .neon-last-branch for easy deletion'
      );
      process.exit(1);
  }
}

main().catch(handleError);
