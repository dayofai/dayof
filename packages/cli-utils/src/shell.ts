import { type SpawnSyncOptions, spawn, spawnSync } from 'node:child_process';

/**
 * Execute a command synchronously with proper argument handling
 * This avoids shell injection vulnerabilities
 */
export function execSync(
  command: string,
  args: string[],
  options: SpawnSyncOptions = {}
): {
  success: boolean;
  stdout?: string;
  stderr?: string;
  status: number | null;
} {
  const result = spawnSync(command, args, {
    ...options,
    shell: false, // Never use shell to avoid injection
  });

  return {
    success: (result.status ?? 0) === 0,
    stdout: result.stdout?.toString(),
    stderr: result.stderr?.toString(),
    status: result.status,
  };
}

/**
 * Execute a command with stdio inherited (shows output in terminal)
 */
export function execInteractive(
  command: string,
  args: string[],
  options: SpawnSyncOptions = {}
): boolean {
  const result = spawnSync(command, args, {
    ...options,
    stdio: 'inherit',
    shell: false,
  });
  return (result.status ?? 0) === 0;
}

/**
 * Get current git branch
 */
export function getCurrentGitBranch(cwd: string): string | undefined {
  const result = execSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd,
  });
  if (!(result.success && result.stdout)) {
    return;
  }
  const branch = result.stdout.trim();
  return branch === '' ? undefined : branch;
}

/**
 * Execute Vercel CLI command
 */
export function vercelCommand(
  args: string[],
  options: SpawnSyncOptions & { team?: string } = {}
): boolean {
  const finalArgs = [...args];
  if (options.team) {
    finalArgs.push('--scope', options.team);
  }

  const { team: _team, ...spawnOptions } = options;
  return execInteractive('vercel', finalArgs, spawnOptions);
}

/**
 * Safe way to write to stdin of a command
 * Used for passing sensitive values like API keys
 */
export function execWithStdin(
  command: string,
  args: string[],
  stdin: string,
  options: SpawnSyncOptions = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      ...options,
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: false,
    });

    child.stdin.write(stdin);
    child.stdin.end();

    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}
