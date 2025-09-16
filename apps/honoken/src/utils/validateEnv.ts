import type { Env } from '../types';

/**
 * Validates required environment variables at startup
 * Throws an error with a descriptive message if any required variables are missing
 */

// biome-ignore lint: Centralized env validation intentionally consolidates checks
export function validateEnv(env: Partial<Env>): asserts env is Env {
  const mergedEnv = {
    ...(process.env as Record<string, string | undefined>),
    ...(env as unknown as Record<string, string | undefined>),
  } as Record<string, string | undefined>;

  const requiredVars = [
    // Database (one of these must be present)
    {
      names: ['TEMP_BRANCH_DATABASE_URL', 'DATABASE_URL', 'DEV_DATABASE_URL'],
      error: 'Either TEMP_BRANCH_DATABASE_URL or DATABASE_URL or DEV_DATABASE_URL must be set',
    },
    // Blob storage
    {
      names: ['BLOB_READ_WRITE_TOKEN'],
      error: 'BLOB_READ_WRITE_TOKEN is required for Vercel Blob',
    },
    // Admin auth
    {
      names: ['HONOKEN_ADMIN_USERNAME'],
      error: 'HONOKEN_ADMIN_USERNAME is required for admin endpoints',
    },
    {
      names: ['HONOKEN_ADMIN_PASSWORD'],
      error: 'HONOKEN_ADMIN_PASSWORD is required for admin endpoints',
    },
    // Encryption - versioned keys
    {
      names: ['HONOKEN_ENCRYPTION_KEY_V1'],
      error: 'HONOKEN_ENCRYPTION_KEY_V1 is required for certificate encryption',
    },
    {
      names: ['HONOKEN_ENCRYPTION_KEY_CURRENT'],
      error:
        'HONOKEN_ENCRYPTION_KEY_CURRENT is required to specify the active encryption key version',
    },
    // Service metadata
    {
      names: ['SERVICE_NAME'],
      error: 'SERVICE_NAME is required for logging and monitoring',
    },
    {
      names: ['ENVIRONMENT'],
      error: 'ENVIRONMENT is required for logging and monitoring',
    },
    // PostHog
    {
      names: ['POSTHOG_PROJECT_API_KEY'],
      error:
        'POSTHOG_PROJECT_API_KEY is required for analytics and error tracking',
    },
  ];

  const missingVars: string[] = [];

  for (const requirement of requiredVars) {
    const hasAny = requirement.names.some((name) => mergedEnv[name]);
    if (!hasAny) {
      missingVars.push(requirement.error);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Environment validation failed:\n${missingVars.map((err) => `  - ${err}`).join('\n')}\n\n` +
        'Please ensure all required environment variables are set in your Vercel project settings.'
    );
  }

  // Validate versioned encryption keys
  const currentVersion = mergedEnv['HONOKEN_ENCRYPTION_KEY_CURRENT'];
  if (currentVersion) {
    const versionedKeyName = `HONOKEN_ENCRYPTION_KEY_${currentVersion.toUpperCase()}`;
    const versionedKey = mergedEnv[versionedKeyName];

    if (!versionedKey) {
      throw new Error(
        `HONOKEN_ENCRYPTION_KEY_CURRENT is set to '${currentVersion}' but ${versionedKeyName} is not defined. ` +
          'Please ensure the corresponding encryption key is set.'
      );
    }

    // Validate the key format
    try {
      const keyBuffer = Buffer.from(versionedKey, 'base64');
      if (keyBuffer.length !== 32) {
        throw new Error('Key must be exactly 32 bytes (256 bits)');
      }
    } catch (error) {
      throw new Error(
        `Invalid ${versionedKeyName}: ${error instanceof Error ? error.message : 'Invalid base64 encoding'}. ` +
          'The key must be a base64-encoded 256-bit (32 byte) value.'
      );
    }
  }

  // Validate numeric environment variables if present
  const numericVars = [
    { name: 'POSTHOG_BATCH_SIZE', min: 1, max: 1000 },
    { name: 'POSTHOG_FLUSH_INTERVAL', min: 1000, max: 300_000 },
  ];

  for (const { name, min, max } of numericVars) {
    const value = mergedEnv[name];
    if (value) {
      const num = Number.parseInt(value, 10);
      if (Number.isNaN(num) || num < min || num > max) {
        throw new Error(
          `Invalid ${name}: must be a number between ${min} and ${max}, got "${value}"`
        );
      }
    }
  }

  // Validate sample rate if present
  if (mergedEnv['LOG_SAMPLE_SUCCESS_RATE']) {
    const rate = Number.parseFloat(mergedEnv['LOG_SAMPLE_SUCCESS_RATE']!);
    if (Number.isNaN(rate) || rate < 0 || rate > 1) {
      throw new Error(
        `Invalid LOG_SAMPLE_SUCCESS_RATE: must be a number between 0 and 1, got \"${mergedEnv['LOG_SAMPLE_SUCCESS_RATE']}\"`
      );
    }
  }
}
