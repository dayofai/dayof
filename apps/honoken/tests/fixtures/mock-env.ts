import { vi } from 'vitest';
import type { webcrypto } from 'node:crypto';
import type { Env } from '../../src/types';
import { TEST_CERT_DATA, TEST_PASS_DATA, TEST_DEVICE_DATA, TEST_REGISTRATION_DATA, TEST_APNS_KEY_DATA, TEST_CERT_BUNDLE } from './test-data';

/**
 * Creates a mock Env object for testing
 * Addresses the complex authentication and encryption challenges identified
 */
type EnvOverrides = Partial<Env> & Record<`HONOKEN_ENCRYPTION_KEY_${string}`, string>;

export function createMockEnv(overrides: EnvOverrides = {} as EnvOverrides): Env {
  const mockEnv: Env = {
    // Database URLs
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
    DEV_DATABASE_URL: 'postgresql://test:test@localhost:5432/test_dev_db',
    
    // Upstash Redis storage (replacing R2)
    UPSTASH_REDIS_REST_URL: 'http://localhost:8079',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
    
    // Environment
    ENVIRONMENT: 'test',
    
    // Versioned encryption keys
    HONOKEN_ENCRYPTION_KEY_V1: Buffer.from('test-encryption-key-32-chars-ok!').toString('base64'),
    HONOKEN_ENCRYPTION_KEY_CURRENT: 'v1',
    // Legacy key - deprecated
    HONOKEN_PEM_BUNDLE_ENCRYPTION_KEY: 'test-encryption-key-32-chars-long!',
    
    // Admin auth
    HONOKEN_ADMIN_USERNAME: 'testadmin',
    HONOKEN_ADMIN_PASSWORD: 'testpass123',
    
    // Required env vars
    SERVICE_NAME: 'honoken-test',
    // HONOKEN_BASELIME_API_KEY removed - no longer using Baselime
    HONOKEN_RELEASE_VERSION: '0.0.0-test',
    VERBOSE_LOGGING: 'true', // Enable verbose logging in tests
    
    // PostHog Configuration
    POSTHOG_PROJECT_API_KEY: 'phc_test_key',
    POSTHOG_HOST: 'https://test.posthog.com',
    POSTHOG_BATCH_SIZE: '10', // Smaller batch size for tests
    POSTHOG_FLUSH_INTERVAL: '1000', // Faster flush for tests
    
    // Apply any overrides
    ...overrides
  };

  return mockEnv;
}

/**
 * Sets up mock crypto operations that properly decrypt test certificate data
 */
export function setupMockCrypto() {
  let callCount = 0;
  
  const mockCrypto = {
    subtle: {
      importKey: vi.fn().mockResolvedValue({} as unknown as webcrypto.CryptoKey),
      decrypt: vi.fn().mockImplementation(async (algorithm: any, key: webcrypto.CryptoKey, data: ArrayBuffer) => {
        // Return the test certificate bundle as encrypted JSON when decrypted
        const bundleJson = JSON.stringify(TEST_CERT_BUNDLE);
        return new TextEncoder().encode(bundleJson);
      }),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      generateKey: vi.fn().mockResolvedValue({} as unknown as webcrypto.CryptoKey),
    },
    getRandomValues: vi.fn().mockImplementation((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
    randomUUID: vi.fn().mockImplementation(() => {
      // Generate different UUIDs for each call to test uniqueness
      callCount++;
      const uuid = `12345678-1234-4${callCount}67-89ab-123456789abc`;
      return uuid;
    }),
  };

  Object.defineProperty(global, 'crypto', {
    value: mockCrypto,
    writable: true,
    configurable: true
  });

  return mockCrypto;
}

/**
 * Creates a mock database client that mimics Drizzle ORM behavior
 * Handles the complex encrypted certificate and APNS key scenarios
 */
export function createMockDbClient() {
  return {
    // Mock Hyperdrive connectionString property
    connectionString: 'postgresql://test:test@localhost:5432/test',
    
    // Mock the query builder pattern used throughout the codebase
    query: {
      passes: {
        findFirst: vi.fn().mockImplementation((options) => {
          // Mock pass lookup for authentication
          if (options?.where) {
            return Promise.resolve(TEST_PASS_DATA);
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([TEST_PASS_DATA]),
      },
      passTypes: {
        findFirst: vi.fn().mockResolvedValue({
          passTypeIdentifier: 'pass.com.example.test-event',
          certRef: 'test-cert-ref'
        }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      devices: {
        findFirst: vi.fn().mockResolvedValue(TEST_DEVICE_DATA),
        findMany: vi.fn().mockResolvedValue([TEST_DEVICE_DATA]),
      },
      registrations: {
        findFirst: vi.fn().mockImplementation((options) => {
          // Mock existing registration check
          return Promise.resolve(TEST_REGISTRATION_DATA);
        }),
        findMany: vi.fn().mockResolvedValue([TEST_REGISTRATION_DATA]),
      },
      certs: {
        findFirst: vi.fn().mockImplementation((options) => {
          // Mock encrypted certificate data
          return Promise.resolve(TEST_CERT_DATA);
        }),
      },
      apnsKeys: {
        findFirst: vi.fn().mockImplementation((options) => {
          // Mock encrypted APNS key data
          return Promise.resolve(TEST_APNS_KEY_DATA);
        }),
      },
    },
    
    // Mock transaction support
    transaction: vi.fn().mockImplementation(async (callback) => {
      const mockTx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
            onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  then: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
        query: {
          registrations: {
            findFirst: vi.fn().mockResolvedValue(TEST_REGISTRATION_DATA),
          },
        },
      };
      return callback(mockTx);
    }),
    
    // Mock direct query methods
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              then: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
    
    // Mock health check query
    execute: vi.fn().mockResolvedValue([{ result: 1 }]),
  };
}

// Mock R2 bucket removed - now using Upstash Redis storage

/**
 * Creates a mock execution context for Cloudflare Workers
 */
export function createMockContext() {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  };
}

/**
 * Mock factory for creating test logger
 */
export function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
} 