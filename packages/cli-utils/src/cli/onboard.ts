#!/usr/bin/env bun
/**
 * Onboarding script for new developers
 * Checks prerequisites and sets up the development environment
 */

import { exec as execCallback, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
// import { join } from 'node:path';
import { promisify } from 'node:util';
// import { readVercelConfig } from '../config';
import { loadEnv } from '../env';
import { CliError, handleError } from '../errors';

// import { runCommand } from '../shell';

const exec = promisify(execCallback);

interface CheckResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  action?: string;
}

interface Tool {
  name: string;
  command: string;
  checkCommand: string;
  installInstructions: string;
  optional?: boolean;
}

const REQUIRED_TOOLS: Tool[] = [
  {
    name: 'Bun',
    command: 'bun',
    checkCommand: 'bun --version',
    installInstructions: 'curl -fsSL https://bun.sh/install | bash',
  },
  {
    name: 'Git',
    command: 'git',
    checkCommand: 'git --version',
    installInstructions: 'Visit https://git-scm.com/downloads',
  },
];

const OPTIONAL_TOOLS: Tool[] = [
  {
    name: 'GitHub CLI',
    command: 'gh',
    checkCommand: 'gh --version',
    installInstructions:
      'brew install gh (macOS) or visit https://cli.github.com',
    optional: true,
  },
  {
    name: 'Vercel CLI',
    command: 'vercel',
    checkCommand: 'vercel --version',
    installInstructions: 'bun add -g vercel',
    optional: true,
  },
  {
    name: 'Neon CLI',
    command: 'neon',
    checkCommand: 'neon --version',
    installInstructions: 'bun add -g neonctl',
    optional: true,
  },
];

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function printHeader(text: string): void {
  console.log(`\n${colorize('═'.repeat(60), 'cyan')}`);
  console.log(colorize(`  ${text}`, 'bright'));
  console.log(`${colorize('═'.repeat(60), 'cyan')}\n`);
}

function printStep(step: number, total: number, text: string): void {
  console.log(`${colorize(`[${step}/${total}]`, 'blue')} ${text}`);
}

function printResult(result: CheckResult): void {
  let icon: string;
  let color: keyof typeof COLORS;

  if (result.status === 'success') {
    icon = '✓';
    color = 'green';
  } else if (result.status === 'warning') {
    icon = '⚠';
    color = 'yellow';
  } else {
    icon = '✗';
    color = 'red';
  }

  console.log(`  ${colorize(icon, color)} ${result.name}: ${result.message}`);
  if (result.action) {
    console.log(`    ${colorize('→', 'dim')} ${result.action}`);
  }
}

async function checkTool(tool: Tool): Promise<CheckResult> {
  try {
    const { stdout } = await exec(tool.checkCommand);
    const version = stdout.trim().split('\n')[0];
    return {
      name: tool.name,
      status: 'success',
      message: version,
    };
  } catch {
    return {
      name: tool.name,
      status: tool.optional ? 'warning' : 'error',
      message: 'Not installed',
      action: `Install: ${tool.installInstructions}`,
    };
  }
}

async function checkAuthStatus(
  service: string,
  checkCommand: string
): Promise<CheckResult> {
  try {
    await exec(checkCommand);
    return {
      name: `${service} Auth`,
      status: 'success',
      message: 'Authenticated',
    };
  } catch {
    return {
      name: `${service} Auth`,
      status: 'warning',
      message: 'Not authenticated',
      action: `Run: ${service === 'GitHub' ? 'gh auth login' : 'vercel login'}`,
    };
  }
}

function checkEnvironmentFiles(): CheckResult[] {
  const results: CheckResult[] = [];
  const envFiles = [
    { path: '.env', name: 'Root .env' },
    { path: '.env.local', name: 'Root .env.local' },
    { path: 'packages/database/.env', name: 'Database .env' },
  ];

  for (const { path, name } of envFiles) {
    const exists = existsSync(path);
    results.push({
      name,
      status: exists ? 'success' : 'warning',
      message: exists ? 'Found' : 'Not found',
      action: exists
        ? undefined
        : `Create ${path} file with required variables`,
    });
  }

  return results;
}

function checkDatabaseConnection(): CheckResult {
  try {
    const dbEnvPath = 'packages/database/.env';
    if (!existsSync(dbEnvPath)) {
      return {
        name: 'Database Connection',
        status: 'warning',
        message: 'No .env file found',
        action: 'Create packages/database/.env with DEV_DATABASE_URL',
      };
    }

    const env = loadEnv(dbEnvPath);
    if (!env.DEV_DATABASE_URL) {
      return {
        name: 'Database Connection',
        status: 'warning',
        message: 'DEV_DATABASE_URL not configured',
        action: 'Add DEV_DATABASE_URL to packages/database/.env',
      };
    }

    return {
      name: 'Database Connection',
      status: 'success',
      message: 'Configured',
    };
  } catch (error) {
    return {
      name: 'Database Connection',
      status: 'error',
      message: error instanceof Error ? error.message : 'Check failed',
    };
  }
}

function installDependencies(): Promise<void> {
  console.log(`\n${colorize('Installing dependencies...', 'cyan')}`);

  return new Promise((resolve, reject) => {
    const child = spawn('bun', ['install'], {
      stdio: 'inherit',
      shell: false,
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(colorize('✓ Dependencies installed', 'green'));
        resolve();
      } else {
        reject(
          new CliError('Failed to install dependencies', 'INSTALL_FAILED')
        );
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function setupEnvironment(): Promise<void> {
  console.log(`\n${colorize('Setting up environment...', 'cyan')}`);

  // Check if we should pull Vercel environment variables
  try {
    const { stdout } = await exec('vercel whoami 2>/dev/null');
    if (stdout.trim()) {
      console.log(
        '  Detected Vercel authentication, pulling environment variables...'
      );

      return new Promise((resolve) => {
        const child = spawn('bun', ['vercel', 'pull'], {
          stdio: 'inherit',
          shell: false,
          cwd: process.cwd(),
        });

        child.on('close', (code) => {
          if (code === 0) {
            console.log(
              colorize('  ✓ Environment variables pulled from Vercel', 'green')
            );
            resolve();
          } else {
            console.log(
              colorize('  ⚠ Could not pull environment variables', 'yellow')
            );
            resolve(); // Don't fail onboarding if this step fails
          }
        });

        child.on('error', () => {
          console.log(
            colorize('  ⚠ Could not pull environment variables', 'yellow')
          );
          resolve(); // Don't fail onboarding if this step fails
        });
      });
    }
  } catch {
    console.log('  Vercel CLI not authenticated, skipping environment pull');
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: needed complexity
async function runOnboarding(): Promise<void> {
  printHeader('🚀 Day Of Development Environment Setup');

  const totalSteps = 6;
  let currentStep = 1;
  const allResults: CheckResult[] = [];

  // Step 1: Check required tools
  printStep(currentStep++, totalSteps, 'Checking required tools...');
  const requiredResults = await Promise.all(REQUIRED_TOOLS.map(checkTool));
  for (const result of requiredResults) {
    allResults.push(result);
    printResult(result);
  }

  // Step 2: Check optional tools
  printStep(currentStep++, totalSteps, 'Checking optional tools...');
  const optionalResults = await Promise.all(OPTIONAL_TOOLS.map(checkTool));
  for (const result of optionalResults) {
    allResults.push(result);
    printResult(result);
  }

  // Step 3: Check authentication status
  printStep(currentStep++, totalSteps, 'Checking authentication...');

  // Check GitHub auth if gh is installed
  const ghInstalled =
    allResults.find((r) => r.name === 'GitHub CLI')?.status === 'success';
  if (ghInstalled) {
    const ghAuth = await checkAuthStatus('GitHub', 'gh auth status');
    allResults.push(ghAuth);
    printResult(ghAuth);
  }

  // Check Vercel auth if vercel is installed
  const vercelInstalled =
    allResults.find((r) => r.name === 'Vercel CLI')?.status === 'success';
  if (vercelInstalled) {
    const vercelAuth = await checkAuthStatus('Vercel', 'vercel whoami');
    allResults.push(vercelAuth);
    printResult(vercelAuth);
  }

  // Step 4: Check environment files
  printStep(currentStep++, totalSteps, 'Checking environment files...');
  const envResults = await checkEnvironmentFiles();
  allResults.push(...envResults);
  for (const result of envResults) {
    printResult(result);
  }

  // Step 5: Check database configuration
  printStep(currentStep++, totalSteps, 'Checking database configuration...');
  const dbResult = await checkDatabaseConnection();
  allResults.push(dbResult);
  printResult(dbResult);

  // Check if there are any errors
  const errors = allResults.filter((r) => r.status === 'error');
  if (errors.length > 0) {
    printHeader('❌ Setup Incomplete');
    console.log('Please fix the following errors before continuing:\n');
    for (const error of errors) {
      console.log(`  ${colorize('•', 'red')} ${error.name}: ${error.message}`);
      if (error.action) {
        console.log(`    ${colorize('→', 'dim')} ${error.action}`);
      }
    }
    process.exit(1);
  }

  // Step 6: Install dependencies and setup
  printStep(
    currentStep++,
    totalSteps,
    'Installing dependencies and setting up environment...'
  );

  try {
    await installDependencies();
    await setupEnvironment();
  } catch (error) {
    console.error(colorize('\n❌ Setup failed:', 'red'), error);
    process.exit(1);
  }

  // Summary
  printHeader('✅ Setup Complete!');

  const warnings = allResults.filter((r) => r.status === 'warning');
  if (warnings.length > 0) {
    console.log(colorize('Recommendations:', 'yellow'));
    for (const warning of warnings) {
      if (warning.action) {
        console.log(`  • ${warning.action}`);
      }
    }
    console.log();
  }

  console.log(colorize('Next steps:', 'green'));
  console.log(
    `  1. Run ${colorize('bun dev', 'bright')} to start all web apps`
  );
  console.log(
    `  2. Run ${colorize('bun run dev:inngest:events', 'bright')} for background jobs`
  );
  console.log(
    `  3. Run ${colorize('bun run db:studio', 'bright')} to open the database GUI`
  );
  console.log();
  console.log(
    `For more commands, check the README or run ${colorize('bun run', 'bright')}`
  );
  console.log();
}

// Main execution
if (import.meta.main) {
  runOnboarding().catch(handleError);
}
