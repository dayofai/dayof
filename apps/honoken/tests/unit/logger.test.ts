import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from '../../src/utils/logger';

describe('Logger', () => {
  let consoleSpy: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  const createMockContext = (environment = 'production') => ({
    get: vi.fn((key: string) => {
      if (key === 'requestId') return 'test-req-id';
      if (key === 'posthog') return undefined; // No PostHog in tests
      return undefined;
    }),
    env: { 
      ENVIRONMENT: environment,
      VERBOSE_LOGGING: 'false'
    },
    req: { 
      raw: { 
        headers: new Map([
          ['x-vercel-deployment-url', 'honoken-abc123-iad1.vercel.app'],
          ['x-vercel-ip-country', 'US'],
          ['x-vercel-id', 'vercel-123']
        ])
      } 
    }
  });

  describe('info logging', () => {
    it('should create structured JSON logs with correct format in development', () => {
      const mockContext = createMockContext('development');
      const logger = createLogger(mockContext as any);
      
      logger.info('test message', { extra: 'data' });
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData).toMatchObject({
        lvl: 'info',
        msg: 'test message',
        req_id: 'test-req-id',
        region: 'iad1',
        country: 'US',
        vercel_id: 'vercel-123',
        platform: 'vercel-fluid',
        extra: 'data'
      });
      expect(logData.ts).toBeTypeOf('number');
      expect(logData.ts).toBeGreaterThan(Date.now() - 1000); // Recent timestamp
    });

    it('should skip info logs in production when not verbose', () => {
      const mockContext = createMockContext('production');
      mockContext.env.VERBOSE_LOGGING = 'false';
      const logger = createLogger(mockContext as any);
      
      logger.info('test message');
      
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should show info logs in development', () => {
      const mockContext = createMockContext('development');
      const logger = createLogger(mockContext as any);
      
      logger.info('test message');
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should show info logs in production when verbose', () => {
      const mockContext = createMockContext('production');
      mockContext.env.VERBOSE_LOGGING = 'true';
      const logger = createLogger(mockContext as any);
      
      logger.info('test message');
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('warning logging', () => {
    it('should create structured warning logs', () => {
      const mockContext = createMockContext('production');
      const logger = createLogger(mockContext as any);
      
      logger.warn('test warning', { context: 'test' });
      
      expect(consoleSpy.warn).toHaveBeenCalled();
      const logCall = consoleSpy.warn.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData).toMatchObject({
        lvl: 'warn',
        msg: 'test warning',
        req_id: 'test-req-id',
        region: 'iad1',
        country: 'US',
        platform: 'vercel-fluid',
        context: 'test'
      });
    });

    // Removed Sentry-specific tests - warnings now just go to console and PostHog
  });

  describe('error logging', () => {
    it('should create structured error logs with full context', () => {
      const mockContext = createMockContext('production');
      const logger = createLogger(mockContext as any);
      const testError = new Error('Test error');
      testError.stack = 'Error: Test error\n    at test';
      
      logger.error('Error occurred', testError, { context: 'test' });
      
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      const logCall = consoleSpy.error.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData).toMatchObject({
        lvl: 'error',
        msg: 'Error occurred',
        err_msg: 'Test error',
        err_stack: 'Error: Test error\n    at test',
        region: 'iad1',
        country: 'US',
        platform: 'vercel-fluid',
        context: 'test'
      });
    });

    it('should handle non-Error objects', () => {
      const mockContext = createMockContext('production');
      const logger = createLogger(mockContext as any);
      
      logger.error('String error', 'just a string');
      
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      const logCall = consoleSpy.error.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData.err_msg).toBe('just a string');
    });
  });

  describe('environment handling', () => {

    it('should handle missing Vercel headers gracefully', () => {
      const mockContext = {
        get: vi.fn((key: string) => {
          if (key === 'requestId') return 'test-req-id';
          if (key === 'posthog') return undefined;
          return undefined;
        }),
        env: { ENVIRONMENT: 'development' },
        req: { raw: { headers: new Map() } } // No Vercel headers
      };
      
      expect(() => {
        const logger = createLogger(mockContext as any);
        logger.info('test');
      }).not.toThrow();
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData.region).toBe('iad1'); // Default fallback
      expect(logData.country).toBe('unknown'); // Default fallback
      expect(logData.platform).toBe('vercel-fluid');
    });

    it('should fallback to process.env.VERCEL_REGION when header missing', () => {
      const originalVercelRegion = process.env.VERCEL_REGION;
      process.env.VERCEL_REGION = 'fra1';
      
      const mockContext = {
        get: vi.fn((key: string) => {
          if (key === 'requestId') return 'test-req-id';
          if (key === 'posthog') return undefined;
          return undefined;
        }),
        env: { ENVIRONMENT: 'development' },
        req: { raw: { headers: new Map() } }
      };
      
      const logger = createLogger(mockContext as any);
      logger.info('test');
      
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      expect(logData.region).toBe('fra1');
      
      // Restore original env
      if (originalVercelRegion !== undefined) {
        process.env.VERCEL_REGION = originalVercelRegion;
      } else {
        delete process.env.VERCEL_REGION;
      }
    });
  });

  describe('data truncation', () => {
    it('should handle large extra data without breaking', () => {
      const mockContext = createMockContext('production');
      const logger = createLogger(mockContext as any);
      const largeData = { huge: 'x'.repeat(5000) };
      
      expect(() => {
        logger.warn('apns error', largeData);
      }).not.toThrow();
      
      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });
});