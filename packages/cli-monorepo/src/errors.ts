/**
 * Base error class for CLI errors
 */
export class CliError extends Error {
  readonly code: string;
  readonly exitCode: number;

  constructor(message: string, code = 'CLI_ERROR', exitCode = 1) {
    super(message);
    this.name = 'CliError';
    this.code = code;
    this.exitCode = exitCode;
  }
}

/**
 * Error for missing configuration
 */
export class ConfigError extends CliError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR', 1);
    this.name = 'ConfigError';
  }
}

/**
 * Error for API failures
 */
export class ApiError extends CliError {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message, 'API_ERROR', 1);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Handle errors consistently across all CLI scripts
 */
export function handleError(error: unknown): never {
  if (error instanceof CliError) {
    console.error(`Error: ${error.message}`);
    process.exit(error.exitCode);
  }

  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
  } else {
    console.error(`Error: ${String(error)}`);
  }

  process.exit(1);
}

/**
 * Assert a condition and throw if false
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new CliError(message);
  }
}
