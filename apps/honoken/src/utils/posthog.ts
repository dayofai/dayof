import type { Context } from 'hono';
import { PostHog } from 'posthog-node';
import type { Env } from '../types';

// Use stdout/stderr writers instead of console

/**
 * Module-level singleton that persists for the container lifetime.
 * In Fluid Compute, this instance serves thousands of requests,
 * allowing efficient event batching and reduced API calls.
 */
let posthogClient: PostHog | null = null;

/**
 * Health tracking for the PostHog client.
 * We monitor failures to implement circuit breaker patterns.
 */
let consecutiveFailures = 0;
const MAX_FAILURES = 5;
let lastFailureTime = 0;
const CIRCUIT_BREAKER_TIMEOUT = 60_000; // 1 minute

/**
 * Gets or creates a PostHog client optimized for Fluid Compute.
 *
 * Key differences from serverless:
 * - Higher batch sizes (100 vs 1)
 * - Longer flush intervals (30s vs immediate)
 * - Connection reuse across thousands of requests
 * - Circuit breaker for resilience
 */
export function getPostHogClient(env: Env): PostHog | null {
  const write =
    (s: 'out' | 'err') => (msg: string, extra?: Record<string, unknown>) => {
      const line = `${JSON.stringify({ ts: Date.now(), lvl: s === 'out' ? 'info' : 'error', msg, ...(extra || {}) })}\n`;
      s === 'out' ? process.stdout.write(line) : process.stderr.write(line);
    };
  const sysOut = write('out');
  const sysErr = write('err');
  // Circuit breaker: if we've had too many failures recently, don't try
  if (consecutiveFailures >= MAX_FAILURES) {
    const timeSinceLastFailure = Date.now() - lastFailureTime;
    if (timeSinceLastFailure < CIRCUIT_BREAKER_TIMEOUT) {
      sysErr('posthog_circuit_open', {
        failures: consecutiveFailures,
        drop_seconds: Math.ceil(
          (CIRCUIT_BREAKER_TIMEOUT - timeSinceLastFailure) / 1000
        ),
      });
      return null; // Circuit is open, skip PostHog
    }
    // Reset circuit breaker after timeout
    sysOut('posthog_circuit_closed', {
      after_seconds: Math.ceil(timeSinceLastFailure / 1000),
    });
    consecutiveFailures = 0;
  }

  // No API key means PostHog is disabled
  if (!env.POSTHOG_PROJECT_API_KEY) {
    return null;
  }

  // Return existing client if already initialized
  if (posthogClient) {
    return posthogClient;
  }

  try {
    // Parse configuration with defaults optimized for Fluid Compute
    const batchSize = Number.parseInt(env.POSTHOG_BATCH_SIZE || '100', 10);
    const flushInterval = Number.parseInt(
      env.POSTHOG_FLUSH_INTERVAL || '30000',
      10
    );

    // Create client with Fluid Compute optimized settings
    posthogClient = new PostHog(env.POSTHOG_PROJECT_API_KEY, {
      host: env.POSTHOG_HOST || 'https://us.i.posthog.com',

      // Batching configuration - these are KEY for Fluid Compute
      flushAt: batchSize, // Accumulate this many events before sending
      flushInterval, // Or send whatever we have after this time

      // In Fluid Compute, we want batching, not immediate sends
      // This is the opposite of serverless!
      disableGeoip: false, // We can afford the slight overhead

      // Connection settings appropriate for persistent runtime
      requestTimeout: 10_000, // 10 second timeout
      fetchRetryCount: 3, // Retry failed requests
      fetchRetryDelay: 1000, // 1 second between retries
    });

    sysOut('posthog_client_initialized', {
      batch_size: batchSize,
      flush_interval_ms: flushInterval,
      host: env.POSTHOG_HOST || 'https://us.i.posthog.com',
    });

    // Reset failure tracking on successful init
    consecutiveFailures = 0;

    return posthogClient;
  } catch (error) {
    sysErr('posthog_init_failed', {
      error:
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : String(error),
    });
    consecutiveFailures++;
    lastFailureTime = Date.now();
    return null;
  }
}

/**
 * Middleware to inject PostHog into request context.
 * Unlike serverless, we don't flush after each request -
 * we let the batching system work its magic.
 */
export async function posthogMiddleware(
  c: Context<{ Bindings: Env }>,
  next: () => Promise<void>
): Promise<void> {
  const client = getPostHogClient(c.env);
  c.set('posthog', client);

  // Track request start time for performance monitoring
  const startTime = Date.now();

  await next();

  // Only force flush on server errors to ensure they're captured
  if (client && c.res && c.res.status >= 500) {
    try {
      await client.flush();
      const line = `${JSON.stringify({ ts: Date.now(), lvl: 'info', msg: 'posthog_flush_on_5xx' })}\n`;
      process.stdout.write(line);
    } catch (error) {
      const line = `${JSON.stringify({ ts: Date.now(), lvl: 'error', msg: 'posthog_flush_failed_on_5xx', error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error) })}\n`;
      process.stderr.write(line);
      consecutiveFailures++;
      lastFailureTime = Date.now();
    }
  }

  // In Fluid Compute, we can afford to track performance metrics
  if (client && c.res) {
    const duration = Date.now() - startTime;

    // Only track slow requests to avoid noise
    if (duration > 1000) {
      // 1 second threshold
      client.capture({
        distinctId: c.get('requestId') || 'anonymous',
        event: 'slow_request',
        properties: {
          path: c.req.path,
          method: c.req.method,
          status: c.res.status,
          duration_ms: duration,
        },
      });
    }
  }
}

/**
 * Force flush any pending events.
 * Use sparingly - only for critical events or shutdown.
 */
export async function flushPostHog(): Promise<void> {
  if (!posthogClient) {
    return;
  }

  try {
    await posthogClient.flush();
    consecutiveFailures = 0; // Reset on successful flush
  } catch (error) {
    const line = `${JSON.stringify({ ts: Date.now(), lvl: 'error', msg: 'posthog_flush_error', error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error) })}\n`;
    process.stderr.write(line);
    consecutiveFailures++;
    lastFailureTime = Date.now();
  }
}

/**
 * Graceful shutdown for container recycling.
 * This is CRITICAL in Fluid Compute to avoid losing batched events.
 */
export async function shutdownPostHog(): Promise<void> {
  if (!posthogClient) {
    return;
  }

  try {
    const lineStart = `${JSON.stringify({ ts: Date.now(), lvl: 'info', msg: 'posthog_shutdown_start' })}\n`;
    process.stdout.write(lineStart);
    await posthogClient.shutdown();
    posthogClient = null;
    const lineEnd = `${JSON.stringify({ ts: Date.now(), lvl: 'info', msg: 'posthog_shutdown_complete' })}\n`;
    process.stdout.write(lineEnd);
  } catch (error) {
    const line = `${JSON.stringify({ ts: Date.now(), lvl: 'error', msg: 'posthog_shutdown_error', error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error) })}\n`;
    process.stderr.write(line);
  }
}

/**
 * Register shutdown handlers for Vercel container lifecycle.
 * These ensure batched events are sent before the process exits.
 */
if (typeof process !== 'undefined') {
  // SIGTERM is sent by Vercel before container recycling
  process.once('SIGTERM', async () => {
    process.stdout.write(
      `${JSON.stringify({ ts: Date.now(), lvl: 'info', msg: 'sigterm_flush_posthog' })}\n`
    );
    await shutdownPostHog();
  });

  // beforeExit catches normal process termination
  process.once('beforeExit', async () => {
    process.stdout.write(
      `${JSON.stringify({ ts: Date.now(), lvl: 'info', msg: 'beforeexit_flush_posthog' })}\n`
    );
    await shutdownPostHog();
  });
}

/**
 * Optional: Periodic health check and flush for long-running containers.
 * This ensures events are sent even during quiet periods.
 */
let healthCheckInterval: NodeJS.Timeout | null = null;

export function startPeriodicHealthCheck(intervalMs = 60_000): void {
  if (healthCheckInterval) {
    return; // Already running
  }

  healthCheckInterval = setInterval(async () => {
    if (!posthogClient) {
      return;
    }

    try {
      // Check if we have pending events (PostHog doesn't expose this directly,
      // but we can infer from successful flush)
      await posthogClient.flush();
      consecutiveFailures = 0;
    } catch (error) {
      const line = `${JSON.stringify({ ts: Date.now(), lvl: 'error', msg: 'posthog_health_check_failed', error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error) })}\n`;
      process.stderr.write(line);
      consecutiveFailures++;
      lastFailureTime = Date.now();
    }
  }, intervalMs);

  // Clean up interval on shutdown
  process.once('beforeExit', () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
  });
}
