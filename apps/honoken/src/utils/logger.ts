import type { Context } from 'hono';
import type { PostHog } from 'posthog-node';
import { truncateMiddle } from './crypto';

export type Logger = ReturnType<typeof createLogger>;

/**
 * Determines if we should capture this event to PostHog.
 * In Fluid Compute, we can be more selective since batching is efficient.
 */
function shouldCaptureToPostHog(
  level: 'info' | 'warn' | 'error',
  message: string,
  isProd: boolean
): boolean {
  // Always capture warnings and errors
  if (level === 'warn' || level === 'error') return true;
  
  // In production, only capture significant info events
  if (isProd && level === 'info') {
    const significantPatterns = [
      'request_start',
      'request_ok_sampled',
      'authentication',
      'pass_generated',
      'device_registered',
      'bulk_update',
    ];
    return significantPatterns.some(pattern => message.includes(pattern));
  }
  
  // In development, don't spam PostHog with info logs
  return false;
}

/**
 * Creates a logger optimized for Vercel's Node.js runtime with Fluid Compute.
 * Key optimizations:
 * - Batched PostHog events (not immediate flush)
 * - Selective event capture to reduce noise
 * - Rich context from persistent runtime
 */
export function createLogger(c: Context) {
  const requestId = c.get('requestId') as string | undefined;
  const isDev = c.env.ENVIRONMENT === 'development';
  const isProd = c.env.ENVIRONMENT === 'production';
  const isVerbose = c.env.VERBOSE_LOGGING === 'true';
  
  // Get PostHog from context - might be null if disabled or circuit broken
  const posthog = c.get('posthog') as PostHog | undefined;
  
  // Extract request metadata for all log entries
  const headers = c.req.raw?.headers;
  const baseLogData = {
    req_id: requestId,
    region: process.env.VERCEL_REGION || 'iad1',
    country: headers?.get('x-vercel-ip-country') || 
             headers?.get('cf-ipcountry') || 'unknown',
    vercel_id: headers?.get('x-vercel-id'),
    platform: 'vercel-fluid',
    pid: process.pid, // Process ID helps track container lifecycle
  };

  /**
   * Determines the best distinctId for PostHog events.
   * Prioritizes authenticated user IDs, falls back to device/request IDs.
   */
  const getDistinctId = (data: Record<string, any>): string => {
    // Check for user context (set by auth middleware)
    const userContext = c.get('userContext') as any;
    if (userContext?.distinctId) {
      return userContext.distinctId;
    }
    
    // Fall through various identifiers
    return data.userId || 
           data.attendeeId || 
           data.tenantId || 
           data.deviceLibraryIdentifier || 
           data.serialNumber || 
           data.passTypeIdentifier ||
           requestId || 
           `anonymous-${Date.now()}`;
  };

  /**
   * Captures events to PostHog without forcing flush.
   * In Fluid Compute, batching handles efficiency.
   */
  const captureToPostHog = (
    eventName: string,
    properties: Record<string, any>,
    level: 'info' | 'warn' | 'error',
    error?: Error
  ): void => {
    // Skip if PostHog unavailable or event not significant
    if (!posthog || !shouldCaptureToPostHog(level, eventName, isProd)) {
      return;
    }
    
    const distinctId = getDistinctId(properties);
    
    // Enhance properties with context
    const enhancedProperties: Record<string, any> = {
      ...baseLogData,
      ...properties,
      level,
      timestamp: new Date().toISOString(),
      container_uptime: process.uptime(), // How long this container has been running
      memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };
    
    // Add user context if available
    const userContext = c.get('userContext') as any;
    if (userContext) {
      enhancedProperties.userId = userContext.userId;
      enhancedProperties.tenantId = userContext.tenantId;
      enhancedProperties.attendeeId = userContext.attendeeId;
    }
    
    try {
      if (error && level === 'error') {
        // For errors, use PostHog's exception format
        posthog.capture({
          distinctId,
          event: '$exception',
          properties: {
            ...enhancedProperties,
            $exception_type: error.name,
            $exception_message: error.message,
            $exception_stack_trace_raw: error.stack,
            $exception_handled: true, // These are caught errors
            custom_error_context: eventName, // Preserve our event name
          },
        });
      } else {
        // For warnings and info, use custom events
        posthog.capture({
          distinctId,
          event: eventName,
          properties: enhancedProperties,
        });
      }
      
      // NO FLUSH HERE - this is the key difference for Fluid Compute
      // Let PostHog's batching system handle when to send events
    } catch (captureError) {
      // Log locally but don't throw - logging should never break the app
      console.error('Failed to capture to PostHog:', captureError);
    }
  };

  return {
    info: (message: string, data: Record<string, any> = {}) => {
      if (!isDev && !isVerbose) return;
      
      console.log(JSON.stringify({
        ts: Date.now(),
        lvl: 'info',
        msg: message,
        ...baseLogData,
        ...data,
      }));
      
      // Selectively capture to PostHog based on message importance
      captureToPostHog(`log_${message}`, { message, ...data }, 'info');
    },

    warn: (message: string, data: Record<string, any> = {}) => {
      console.warn(JSON.stringify({
        ts: Date.now(),
        lvl: 'warn',
        msg: message,
        ...baseLogData,
        ...data,
      }));
      
      // All warnings go to PostHog for monitoring
      captureToPostHog('server_warning', { 
        message, 
        warning_type: data.type || 'general',
        ...data 
      }, 'warn');
    },

    // Async variants no longer need special handling in Fluid Compute
    warnAsync: async (message: string, data: Record<string, any> = {}) => {
      // In Fluid Compute, this is just an alias since we don't flush
      const logger = createLogger(c);
      logger.warn(message, data);
    },

    error: (message: string, error: unknown, data: Record<string, any> = {}) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      console.error(JSON.stringify({
        ts: Date.now(),
        lvl: 'error',
        msg: message,
        err_msg: errorObj.message,
        err_stack: errorObj.stack,
        ...baseLogData,
        ...data,
      }));
      
      // All errors go to PostHog with full context
      captureToPostHog('server_error', {
        message,
        error_name: errorObj.name,
        error_message: errorObj.message,
        error_stack: errorObj.stack,
        ...data,
      }, 'error', errorObj);
    },

    errorAsync: async (message: string, error: unknown, data: Record<string, any> = {}) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // Log immediately
      const logger = createLogger(c);
      logger.error(message, error, data);
      
      // Only force flush for critical errors
      // This is a Fluid Compute optimization - we're selective about flushing
      const isCritical = data.severity === 'critical' || 
                        message.includes('critical') ||
                        message.includes('unhandled') ||
                        message.includes('database');
                        
      if (posthog && isCritical) {
        try {
          await posthog.flush();
          console.log(`Flushed PostHog due to critical error: ${message}`);
        } catch (flushError) {
          console.error('Critical error flush failed:', flushError);
        }
      }
    },
  };
}