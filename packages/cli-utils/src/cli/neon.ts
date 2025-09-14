#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { getNeonConfigPath, readNeonConfig, writeNeonConfig } from '../config';
import {
  loadEnvFromFile,
  readEnvVarFromFile,
  removeEnvVar,
  upsertEnvVar,
} from '../env';
import { assert, CliError, handleError } from '../errors';
import { execInteractive, execWithStdin } from '../shell';

interface NeonBranch {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
}

interface NeonEndpoint {
  id: string;
  branch_id: string;
  type: string;
  autoscaling_limit_min_cu: number;
  autoscaling_limit_max_cu: number;
}

interface LastBranchInfo {
  name: string;
  id: string;
  timestamp: string;
  projectId: string;
}

/**
 * Get Neon credentials from environment or config
 */
async function getNeonCredentials(): Promise<{
  apiKey: string;
  projectId: string;
}> {
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
          if (foundKey) apiKey = foundKey;
        }
        if (!projectId) {
          const foundId = readEnvVarFromFile(appEnvPath, 'NEON_PROJECT_ID');
          if (foundId) projectId = foundId;
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
async function neonRequest(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const { apiKey } = await getNeonCredentials();

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
    return null;
  }

  return response.json();
}

/**
 * Parse TTL string to seconds
 */
function parseTTL(ttl: string): number {
  const match = ttl.match(/^(\d+)([hmd])$/);
  if (!match) {
    throw new CliError(
      "Invalid TTL format. Use format like '2h', '30m', or '7d'"
    );
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86_400;
    default:
      throw new CliError(
        "Invalid TTL unit. Use 'm' (minutes), 'h' (hours), or 'd' (days)"
      );
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
    require('fs').unlinkSync(filePath);
  }
}

/**
 * Create a new Neon branch
 */
async function branchCreate(args: string[]): Promise<void> {
  // Parse arguments - support both positional and named
  let branchName: string | undefined;
  let ttl = '2h'; // default TTL

  // Check for named arguments
  const nameIndex = args.indexOf('--name');
  const ttlIndex = args.indexOf('--ttl');

  if (nameIndex >= 0) {
    branchName = args[nameIndex + 1];
  } else if (args[0] && !args[0].startsWith('--')) {
    branchName = args[0];
  }

  if (ttlIndex >= 0) {
    ttl = args[ttlIndex + 1];
  } else if (args[1] && !args[1].startsWith('--')) {
    ttl = args[1];
  } else if (args[0] && !branchName) {
    // If first arg looks like TTL (e.g., "2h")
    if (/^\d+[hmd]$/.test(args[0])) {
      ttl = args[0];
    }
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
  const ttlSeconds = parseTTL(ttl);

  // Get parent branch (default branch)
  const { branch: parent } = await neonRequest(
    `/projects/${projectId}/branches`
  );

  assert(parent, 'Could not find parent branch');

  console.log(
    `→ Creating branch '${branchName}' (parent ${parent.name}, expires in ${ttl})`
  );

  // Create the branch
  const data = await neonRequest(`/projects/${projectId}/branches`, {
    method: 'POST',
    body: JSON.stringify({
      parent_id: parent.id,
      name: branchName,
      ttl_seconds: ttlSeconds,
    }),
  });

  console.log(`✓ Branch created: ${data.branch.id}`);

  // Get connection details
  const connectionUri = data.connection_uris?.[0]?.connection_uri;
  if (connectionUri) {
    // Update .env.local files
    const rootEnvPath = resolve(process.cwd(), '.env.local');
    const dbEnvPath = resolve(process.cwd(), 'packages/database/.env.local');

    console.log('→ Updating environment files...');

    // Root .env.local
    if (existsSync(rootEnvPath)) {
      upsertEnvVar(rootEnvPath, 'TEMP_BRANCH_DATABASE_URL', connectionUri);
      upsertEnvVar(rootEnvPath, 'DEV_DATABASE_URL', connectionUri);
      console.log('  ✓ Updated .env.local');
    }

    // packages/database/.env.local
    if (existsSync(dbEnvPath)) {
      upsertEnvVar(dbEnvPath, 'TEMP_BRANCH_DATABASE_URL', connectionUri);
      upsertEnvVar(dbEnvPath, 'DEV_DATABASE_URL', connectionUri);
      console.log('  ✓ Updated packages/database/.env.local');
    }

    console.log('\n📋 Connection String:');
    console.log(connectionUri);
  }

  // Save branch info for easy deletion
  saveLastBranch({
    name: branchName,
    id: data.branch.id,
    timestamp: new Date().toISOString(),
    projectId,
  });

  console.log('\n✓ Branch info saved to .neon-last-branch');
  console.log("  Run 'bun neon branch:delete' to delete this branch");
}

/**
 * Delete a Neon branch
 */
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
  const { branches } = await neonRequest(`/projects/${projectId}/branches`);

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
  const { endpoints } = await neonRequest(
    `/projects/${projectId}/endpoints?branch_id=${encodeURIComponent(target.id)}`
  );

  // Find endpoints for this branch
  const branchEndpoints = endpoints.filter(
    (ep: NeonEndpoint) => ep.branch_id === target.id
  );

  console.log(
    `→ Deleting branch '${target.name}' (${target.id}) with ${branchEndpoints.length} endpoint(s)`
  );

  // Delete endpoints first
  for (const endpoint of branchEndpoints) {
    console.log(`  → Deleting endpoint ${endpoint.id}...`);
    await neonRequest(`/projects/${projectId}/endpoints/${endpoint.id}`, {
      method: 'DELETE',
    });
  }

  // Delete branch
  await neonRequest(`/projects/${projectId}/branches/${target.id}`, {
    method: 'DELETE',
  });

  console.log(`✓ Branch '${target.name}' deleted`);

  // Clean up environment variables
  const rootEnvPath = resolve(process.cwd(), '.env.local');
  const dbEnvPath = resolve(process.cwd(), 'packages/database/.env.local');

  console.log('→ Cleaning up environment files...');

  if (existsSync(rootEnvPath)) {
    removeEnvVar(rootEnvPath, 'TEMP_BRANCH_DATABASE_URL');
    removeEnvVar(rootEnvPath, 'DEV_DATABASE_URL');
    console.log('  ✓ Cleaned .env.local');
  }

  if (existsSync(dbEnvPath)) {
    removeEnvVar(dbEnvPath, 'TEMP_BRANCH_DATABASE_URL');
    removeEnvVar(dbEnvPath, 'DEV_DATABASE_URL');
    console.log('  ✓ Cleaned packages/database/.env.local');
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
    new Promise((resolve) => {
      const promptText = defaultValue
        ? `${prompt} [${defaultValue}]: `
        : `${prompt}: `;
      rl.question(promptText, (answer) => {
        resolve(answer.trim() || defaultValue || '');
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
      await branchCreate(args);
      break;
    case 'branch:delete':
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
