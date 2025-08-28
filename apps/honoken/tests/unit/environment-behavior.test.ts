import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from '../../src/utils/logger';

describe('Environment-Specific Behavior', () => {
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

  const createMockContext = (overrides = {}) => ({
    get: vi.fn((key: string) => {
      if (key === 'requestId') return 'test-req-id';
      if (key === 'posthog') return undefined; // No PostHog in tests
      return undefined;
    }),
    env: { 
      ENVIRONMENT: 'production',
      VERBOSE_LOGGING: 'false',
      ...overrides
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

  describe('Development Environment', () => {
    it('should log to console in development', () => {
      const mockContext = createMockContext({ ENVIRONMENT: 'development' });
      const logger = createLogger(mockContext as any);
      
      logger.info('dev info message');
      logger.warn('dev warning');
      logger.error('dev error', new Error('test'));
      
      expect(consoleSpy.log).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should still flag critical warnings in development for consistency', () => {
      const mockContext = createMockContext({ ENVIRONMENT: 'development' });
      const logger = createLogger(mockContext as any);
      
      logger.warn('apns critical error', { severity: 'critical_warn' });
      
      // Should still create structured logs
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should create error logs consistently in development', () => {
      const mockContext = createMockContext({ ENVIRONMENT: 'development' });
      const logger = createLogger(mockContext as any);
      
      logger.error('dev error', new Error('test'));
      
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('Production Environment', () => {
    it('should create structured warning logs in production', () => {
      const mockContext = createMockContext({ ENVIRONMENT: 'production' });
      const logger = createLogger(mockContext as any);
      
      logger.warn('prod warning');
      
      expect(consoleSpy.warn).toHaveBeenCalled();
      const logCall = consoleSpy.warn.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      expect(logData.lvl).toBe('warn');
      expect(logData.platform).toBe('vercel-fluid');
    });

    // Removed Sentry-specific test - warnings now just go to console/PostHog

    it('should suppress info logs in production unless verbose', () => {
      const mockContext = createMockContext({ 
        ENVIRONMENT: 'production',
        VERBOSE_LOGGING: 'false'
      });
      const logger = createLogger(mockContext as any);
      
      logger.info('prod info message');
      
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should show info logs in production when verbose enabled', () => {
      const mockContext = createMockContext({ 
        ENVIRONMENT: 'production',
        VERBOSE_LOGGING: 'true'
      });
      const logger = createLogger(mockContext as any);
      
      logger.info('verbose prod info message');
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('Missing Environment Variables', () => {
    it('should handle missing ENVIRONMENT gracefully', () => {
      const mockContext = createMockContext({ ENVIRONMENT: undefined });
      
      expect(() => {
        const logger = createLogger(mockContext as any);
        logger.info('test message');
        logger.warn('test warning');
        logger.error('test error', new Error('test'));
      }).not.toThrow();
    });

    // Removed Sentry DSN test - no longer relevant

    it('should handle missing VERBOSE_LOGGING gracefully', () => {
      const mockContext = createMockContext({ VERBOSE_LOGGING: undefined });
      
      expect(() => {
        const logger = createLogger(mockContext as any);
        logger.info('test message');
      }).not.toThrow();
    });
  });

  describe('Missing Vercel Properties', () => {
    it('should handle missing headers object gracefully', () => {
      const mockContext = {
        get: vi.fn().mockReturnValue('test-req-id'),
        env: { ENVIRONMENT: 'development' },
        req: { raw: {} } // No headers
      };
      
      expect(() => {
        const logger = createLogger(mockContext as any);
        logger.info('test message');
      }).not.toThrow();
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData.region).toBe('iad1'); // Default fallback
      expect(logData.country).toBe('unknown'); // Default fallback
      expect(logData.platform).toBe('vercel-fluid');
    });

    it('should handle partial Vercel headers gracefully', () => {
      const mockContext = {
        get: vi.fn().mockReturnValue('test-req-id'),
        env: { ENVIRONMENT: 'development' },
        req: {
          raw: {
            headers: new Map([
              ['x-vercel-ip-country', 'US']
              // Missing other headers
            ])
          }
        }
      };
      
      expect(() => {
        const logger = createLogger(mockContext as any);
        logger.info('test message');
      }).not.toThrow();
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData.country).toBe('US');
      expect(logData.region).toBe('iad1'); // Fallback
      expect(logData.vercel_id).toBeUndefined();
    });

    it('should handle missing req object gracefully', () => {
      const mockContext = {
        get: vi.fn().mockReturnValue('test-req-id'),
        env: { ENVIRONMENT: 'development' },
        req: {} // Empty req object, no raw property
      };
      
      expect(() => {
        const logger = createLogger(mockContext as any);
        logger.info('test message');
      }).not.toThrow();
    });

    it('should handle missing request ID gracefully', () => {
      const mockContext = createMockContext({ ENVIRONMENT: 'development' });
      mockContext.get = vi.fn().mockReturnValue(undefined);
      
      expect(() => {
        const logger = createLogger(mockContext as any);
        logger.info('test message');
      }).not.toThrow();
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData.req_id).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined data objects', () => {
      const mockContext = createMockContext();
      const logger = createLogger(mockContext as any);
      
      expect(() => {
        logger.info('test message', null as any);
        logger.warn('test warning', undefined as any);
        logger.error('test error', new Error('test'), null as any);
      }).not.toThrow();
    });

    it('should handle circular references in data objects', () => {
      const mockContext = createMockContext();
      const logger = createLogger(mockContext as any);
      
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      expect(() => {
        logger.info('test message', circularObj);
      }).not.toThrow();
    });

    it('should handle moderately large data objects', () => {
      const mockContext = createMockContext({ ENVIRONMENT: 'development' });
      const logger = createLogger(mockContext as any);
      
      // Create a large but not excessive object (under 3KB to avoid truncation issues)
      const largeObj = {
        data: 'x'.repeat(1000),
        nested: {
          moreData: 'y'.repeat(1000),
          items: Array(50).fill(0).map((_, i) => ({ id: i, name: `item-${i}` }))
        }
      };
      
      expect(() => {
        logger.warn('large data warning', largeObj);
      }).not.toThrow();
      
      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });

  describe('Different Environment Values', () => {
    const testEnvironments = ['development', 'staging', 'production', 'test', 'preview'];
    
    testEnvironments.forEach(env => {
      it(`should handle ${env} environment without errors`, () => {
        const mockContext = createMockContext({ ENVIRONMENT: env });
        
        expect(() => {
          const logger = createLogger(mockContext as any);
          logger.info(`${env} info message`);
          logger.warn(`${env} warning message`);
          logger.error(`${env} error message`, new Error('test'));
        }).not.toThrow();
      });
    });

    it('should handle unexpected environment values', () => {
      const mockContext = createMockContext({ ENVIRONMENT: 'unknown-env' });
      
      expect(() => {
        const logger = createLogger(mockContext as any);
        logger.info('unknown env message');
        logger.warn('unknown env warning');
      }).not.toThrow();
    });
  });

  describe('Vercel-specific behavior', () => {
    it('should use default region when VERCEL_REGION not set', () => {
      const originalVercelRegion = process.env.VERCEL_REGION;
      delete process.env.VERCEL_REGION;
      
      const mockContext = createMockContext({ ENVIRONMENT: 'development' });
      const logger = createLogger(mockContext as any);
      logger.info('test message');
      
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      expect(logData.region).toBe('iad1'); // Default region
      
      // Restore original env
      if (originalVercelRegion !== undefined) {
        process.env.VERCEL_REGION = originalVercelRegion;
      }
    });

    it('should fallback to process.env.VERCEL_REGION when header missing', () => {
      const originalVercelRegion = process.env.VERCEL_REGION;
      process.env.VERCEL_REGION = 'syd1';
      
      const mockContext = createMockContext({ ENVIRONMENT: 'development' });
      mockContext.req.raw.headers = new Map(); // Empty headers
      
      const logger = createLogger(mockContext as any);
      logger.info('test message');
      
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      expect(logData.region).toBe('syd1');
      
      // Restore original env
      if (originalVercelRegion !== undefined) {
        process.env.VERCEL_REGION = originalVercelRegion;
      } else {
        delete process.env.VERCEL_REGION;
      }
    });

    it('should include platform tag in all logs', () => {
      const mockContext = createMockContext({ ENVIRONMENT: 'development' });
      const logger = createLogger(mockContext as any);
      
      logger.info('test message');
      
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      expect(logData.platform).toBe('vercel-fluid');
    });
  });
});