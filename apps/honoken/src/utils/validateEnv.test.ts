import { describe, it, expect } from 'vitest';
import { validateEnv } from './validateEnv';
import type { Env } from '../types';

describe('validateEnv', () => {
  const validEnv: Env = {
    DATABASE_URL: 'postgresql://test',
    UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
    HONOKEN_ADMIN_USERNAME: 'admin',
    HONOKEN_ADMIN_PASSWORD: 'password',
    HONOKEN_ENCRYPTION_KEY_V1: Buffer.from(new Uint8Array(32)).toString('base64'), // 32 bytes
    HONOKEN_ENCRYPTION_KEY_CURRENT: 'v1',
    HONOKEN_PEM_BUNDLE_ENCRYPTION_KEY: Buffer.from(new Uint8Array(32)).toString('base64'), // Legacy - 32 bytes
    SERVICE_NAME: 'test-service',
    ENVIRONMENT: 'test',
    POSTHOG_PROJECT_API_KEY: 'phc_test',
  };

  it('should pass with all required variables', () => {
    expect(() => validateEnv(validEnv)).not.toThrow();
  });

  it('should pass with DEV_DATABASE_URL instead of DATABASE_URL', () => {
    const env = { ...validEnv };
    delete env.DATABASE_URL;
    env.DEV_DATABASE_URL = 'postgresql://dev-test';
    expect(() => validateEnv(env)).not.toThrow();
  });

  it('should fail without any database URL', () => {
    const env = { ...validEnv };
    delete env.DATABASE_URL;
    expect(() => validateEnv(env)).toThrow('Either DATABASE_URL or DEV_DATABASE_URL must be set');
  });

  it('should fail without Redis credentials', () => {
    const env = { ...validEnv } as Partial<Env>;
    delete env.UPSTASH_REDIS_REST_URL;
    expect(() => validateEnv(env)).toThrow('UPSTASH_REDIS_REST_URL is required');
  });

  it('should fail without encryption key', () => {
    const env = { ...validEnv } as Partial<Env>;
    delete env.HONOKEN_ENCRYPTION_KEY_V1;
    expect(() => validateEnv(env)).toThrow('HONOKEN_ENCRYPTION_KEY_V1 is required');
  });

  it('should fail without encryption key current version', () => {
    const env = { ...validEnv } as Partial<Env>;
    delete env.HONOKEN_ENCRYPTION_KEY_CURRENT;
    expect(() => validateEnv(env)).toThrow('HONOKEN_ENCRYPTION_KEY_CURRENT is required');
  });

  it('should fail with invalid encryption key length', () => {
    const env = { ...validEnv };
    env.HONOKEN_ENCRYPTION_KEY_V1 = Buffer.from('short').toString('base64');
    expect(() => validateEnv(env)).toThrow('Key must be exactly 32 bytes');
  });

  it('should fail with invalid base64 encryption key', () => {
    const env = { ...validEnv };
    env.HONOKEN_ENCRYPTION_KEY_V1 = 'not-base64!@#$%';
    expect(() => validateEnv(env)).toThrow('Invalid HONOKEN_ENCRYPTION_KEY_V1');
  });

  it('should fail when current version key is missing', () => {
    const env = { ...validEnv } as any;
    env.HONOKEN_ENCRYPTION_KEY_CURRENT = 'v2';
    delete env.HONOKEN_ENCRYPTION_KEY_V2;
    expect(() => validateEnv(env)).toThrow('HONOKEN_ENCRYPTION_KEY_CURRENT is set to \'v2\' but HONOKEN_ENCRYPTION_KEY_V2 is not defined');
  });

  it('should validate numeric environment variables', () => {
    const env = { ...validEnv };
    env.POSTHOG_BATCH_SIZE = '100';
    env.POSTHOG_FLUSH_INTERVAL = '30000';
    expect(() => validateEnv(env)).not.toThrow();
  });

  it('should fail with invalid POSTHOG_BATCH_SIZE', () => {
    const env = { ...validEnv };
    env.POSTHOG_BATCH_SIZE = '2000'; // > 1000
    expect(() => validateEnv(env)).toThrow('Invalid POSTHOG_BATCH_SIZE');
  });

  it('should validate LOG_SAMPLE_SUCCESS_RATE', () => {
    const env = { ...validEnv };
    env.LOG_SAMPLE_SUCCESS_RATE = '0.01';
    expect(() => validateEnv(env)).not.toThrow();
  });

  it('should fail with invalid LOG_SAMPLE_SUCCESS_RATE', () => {
    const env = { ...validEnv };
    env.LOG_SAMPLE_SUCCESS_RATE = '1.5'; // > 1
    expect(() => validateEnv(env)).toThrow('Invalid LOG_SAMPLE_SUCCESS_RATE');
  });

  it('should report multiple missing variables', () => {
    const env = {};
    expect(() => validateEnv(env)).toThrow(/Environment validation failed:/);
    expect(() => validateEnv(env)).toThrow(/DATABASE_URL/);
    expect(() => validateEnv(env)).toThrow(/UPSTASH_REDIS_REST_URL/);
    expect(() => validateEnv(env)).toThrow(/HONOKEN_ADMIN_USERNAME/);
    expect(() => validateEnv(env)).toThrow(/HONOKEN_ENCRYPTION_KEY_V1/);
  });
});