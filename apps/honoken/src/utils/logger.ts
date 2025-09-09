import type { Context } from 'hono';
import type { PostHog } from 'posthog-node';
// (no console) – route logs to stdout/stderr writers

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
  if (level === 'warn' || level === 'error') {
    return true;
  }

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
    return significantPatterns.some((pattern) => message.includes(pattern));
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
    country:
      headers?.get('x-vercel-ip-country') ||
      headers?.get('cf-ipcountry') ||
      'unknown',
    vercel_id: headers?.get('x-vercel-id'),
    platform: 'vercel-fluid',
    pid: process.pid, // Process ID helps track container lifecycle
  };

  // Structured line writers
  const write = (stream: 'out' | 'err') => (entry: Record<string, unknown>) => {
    const line = `${JSON.stringify(entry)}\n`;
    if (stream === 'out') {
      process.stdout.write(line);
    } else {
      process.stderr.write(line);
    }
  };
  const logOut = write('out');
  const logErr = write('err');

  /**
   * Determines the best distinctId for PostHog events.
   * Prioritizes authenticated user IDs, falls back to device/request IDs.
   */
  type UserContext = {
    distinctId?: string;
    userId?: string;
    tenantId?: string;
    attendeeId?: string;
  };
  type LogData = Record<string, unknown>;

  const getDistinctId = (data: LogData): string => {
    // Check for user context (set by auth middleware)
    const userContext = c.get('userContext') as UserContext | undefined;
    if (userContext?.distinctId) {
      return userContext.distinctId;
    }

    // Fall through various identifiers
    const d = data as Record<string, unknown>;
    const candidates = [
      d.userId,
      d.attendeeId,
      d.tenantId,
      d.deviceLibraryIdentifier,
      d.serialNumber,
      d.passTypeIdentifier,
    ];
    const firstString = candidates.find((v) => typeof v === 'string');
    return (
      (firstString as string | undefined) ||
      requestId ||
      `anonymous-${Date.now()}`
    );
  };

  /**
   * Captures events to PostHog without forcing flush.
   * In Fluid Compute, batching handles efficiency.
   */
  const captureToPostHog = (
    eventName: string,
    properties: LogData,
    level: 'info' | 'warn' | 'error',
    error?: Error
  ): void => {
    // Skip if PostHog unavailable or event not significant
    if (!(posthog && shouldCaptureToPostHog(level, eventName, isProd))) {
      return;
    }

    const distinctId = getDistinctId(properties);

    // Enhance properties with context
    const enhancedProperties: Record<string, unknown> = {
      ...baseLogData,
      ...properties,
      level,
      timestamp: new Date().toISOString(),
      container_uptime: process.uptime(), // How long this container has been running
      memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };

    // Add user context if available
    const userContext = c.get('userContext') as UserContext | undefined;
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
      logErr({
        ts: Date.now(),
        lvl: 'error',
        msg: 'posthog_capture_failed',
        error:
          captureError instanceof Error
            ? {
                name: captureError.name,
                message: captureError.message,
                stack: captureError.stack,
              }
            : String(captureError),
        ...baseLogData,
      });
    }
  };

  return {
    info: (message: string, data: LogData = {}) => {
      if (!(isDev || isVerbose)) {
        return;
      }

      logOut({
        ts: Date.now(),
        lvl: 'info',
        msg: message,
        ...baseLogData,
        ...data,
      });

      // Selectively capture to PostHog based on message importance
      captureToPostHog(`log_${message}`, { message, ...data }, 'info');
    },

    warn: (message: string, data: LogData = {}) => {
      logErr({
        ts: Date.now(),
        lvl: 'warn',
        msg: message,
        ...baseLogData,
        ...data,
      });

      // All warnings go to PostHog for monitoring
      captureToPostHog(
        'server_warning',
        {
          message,
          warning_type: data.type || 'general',
          ...data,
        },
        'warn'
      );
    },

    // Async variants no longer need special handling in Fluid Compute
    warnAsync: async (message: string, data: LogData = {}) => {
      // In Fluid Compute, this is just an alias since we don't flush
      const logger = createLogger(c);
      logger.warn(message, data);
      await Promise.resolve();
    },

    error: (message: string, error: unknown, data: LogData = {}) => {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));

      logErr({
        ts: Date.now(),
        lvl: 'error',
        msg: message,
        err_msg: errorObj.message,
        err_stack: errorObj.stack,
        ...baseLogData,
        ...data,
      });

      // All errors go to PostHog with full context
      captureToPostHog(
        'server_error',
        {
          message,
          error_name: errorObj.name,
          error_message: errorObj.message,
          error_stack: errorObj.stack,
          ...data,
        },
        'error',
        errorObj
      );
    },

    errorAsync: async (message: string, error: unknown, data: LogData = {}) => {
      // Log immediately
      const logger = createLogger(c);
      logger.error(message, error, data);

      // Only force flush for critical errors
      // This is a Fluid Compute optimization - we're selective about flushing
      const isCritical =
        data.severity === 'critical' ||
        message.includes('critical') ||
        message.includes('unhandled') ||
        message.includes('database');

      if (posthog && isCritical) {
        try {
          await posthog.flush();
          logOut({
            ts: Date.now(),
            lvl: 'info',
            msg: 'posthog_flush_on_critical',
            message,
            ...baseLogData,
          });
        } catch (flushError) {
          logErr({
            ts: Date.now(),
            lvl: 'error',
            msg: 'posthog_flush_failed',
            error:
              flushError instanceof Error
                ? {
                    name: flushError.name,
                    message: flushError.message,
                    stack: flushError.stack,
                  }
                : String(flushError),
            ...baseLogData,
          });
        }
      }
    },
  };
}
