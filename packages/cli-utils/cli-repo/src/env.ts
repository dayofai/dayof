import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const NEWLINE_REGEX = /\r?\n/;
const ENV_KV_REGEX = /^([^=]+)=(.*)$/;

/**
 * Load environment variables from a file into process.env
 * Does not override existing values
 */
export function loadEnvFromFile(path: string): void {
  if (!existsSync(path)) {
    return;
  }
  try {
    const content = readFileSync(path, 'utf8');
    const lines = content.split(NEWLINE_REGEX);
    for (const line of lines) {
      const match = line.match(ENV_KV_REGEX);
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

/**
 * Read a specific environment variable from a file
 */
export function readEnvVarFromFile(
  filePath: string,
  name: string
): string | undefined {
  if (!existsSync(filePath)) {
    return;
  }
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split(NEWLINE_REGEX);
    for (const line of lines) {
      if (!line.startsWith(`${name}=`)) {
        continue;
      }
      const raw = line.slice(name.length + 1);
      let value = raw;
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return value;
    }
    return;
  } catch {
    return;
  }
}

/**
 * Insert or update an environment variable in a file
 */
export function upsertEnvVar(
  filePath: string,
  name: string,
  value: string
): void {
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

/**
 * Remove an environment variable from a file
 */
export function removeEnvVar(filePath: string, name: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split(NEWLINE_REGEX);
    const filtered = lines.filter((l) => !l.startsWith(`${name}=`));

    // Only write back if we actually removed something
    if (filtered.length < lines.length) {
      const newContent = filtered.join('\n');
      writeFileSync(
        filePath,
        newContent.endsWith('\n') ? newContent : `${newContent}\n`,
        'utf8'
      );
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Load environment variables from multiple paths
 */
export function loadEnvFromPaths(rootDirectory: string, paths: string[]): void {
  for (const envPath of paths) {
    loadEnvFromFile(resolve(rootDirectory, envPath));
  }
}

/**
 * Load environment variables from a file and return them as an object
 * (does not modify process.env)
 */
export function loadEnv(path: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!existsSync(path)) {
    return env;
  }
  try {
    const content = readFileSync(path, 'utf8');
    const lines = content.split(NEWLINE_REGEX);
    for (const line of lines) {
      const match = line.match(ENV_KV_REGEX);
      if (match) {
        // Remove quotes if present
        let value = match[2];
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        env[match[1]] = value;
      }
    }
  } catch {
    // Ignore errors
  }
  return env;
}

/**
 * Write environment variables to a file
 */
export function writeEnv(path: string, env: Record<string, string>): void {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(env)) {
    // Escape quotes in value and wrap in quotes if contains spaces or special chars
    const needsQuotes =
      value.includes(' ') || value.includes('\n') || value.includes('"');
    const escapedValue = needsQuotes
      ? `"${value.replace(/"/g, '\\"')}"`
      : value;
    lines.push(`${key}=${escapedValue}`);
  }
  const content = lines.length > 0 ? `${lines.join('\n')}\n` : '';

  const dir = resolve(path, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, content, 'utf8');
}
