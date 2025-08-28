import { PostHog } from 'posthog-node';
import type { Env } from '../types';
import type { Context } from 'hono';
import { createLogger } from './logger';

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
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

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
  // Circuit breaker: if we've had too many failures recently, don't try
  if (consecutiveFailures >= MAX_FAILURES) {
    const timeSinceLastFailure = Date.now() - lastFailureTime;
    if (timeSinceLastFailure < CIRCUIT_BREAKER_TIMEOUT) {
      console.warn(`PostHog circuit breaker OPEN: ${consecutiveFailures} consecutive failures, events will be dropped for ${Math.ceil((CIRCUIT_BREAKER_TIMEOUT - timeSinceLastFailure) / 1000)}s`);
      return null; // Circuit is open, skip PostHog
    }
    // Reset circuit breaker after timeout
    console.log(`PostHog circuit breaker CLOSED: resetting after ${Math.ceil(timeSinceLastFailure / 1000)}s timeout`);
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
    const batchSize = parseInt(env.POSTHOG_BATCH_SIZE || '100', 10);
    const flushInterval = parseInt(env.POSTHOG_FLUSH_INTERVAL || '30000', 10);

    // Create client with Fluid Compute optimized settings
    posthogClient = new PostHog(env.POSTHOG_PROJECT_API_KEY, {
      host: env.POSTHOG_HOST || 'https://us.i.posthog.com',
      
      // Batching configuration - these are KEY for Fluid Compute
      flushAt: batchSize,      // Accumulate this many events before sending
      flushInterval: flushInterval, // Or send whatever we have after this time
      
      // In Fluid Compute, we want batching, not immediate sends
      // This is the opposite of serverless!
      disableGeoip: false, // We can afford the slight overhead
      
      // Connection settings appropriate for persistent runtime
      requestTimeout: 10000, // 10 second timeout
      fetchRetryCount: 3,   // Retry failed requests
      fetchRetryDelay: 1000, // 1 second between retries
    });

    console.log(`PostHog client initialized for Fluid Compute:
      - Batch size: ${batchSize} events
      - Flush interval: ${flushInterval}ms
      - Host: ${env.POSTHOG_HOST || 'https://us.i.posthog.com'}`);
    
    // Reset failure tracking on successful init
    consecutiveFailures = 0;
    
    return posthogClient;
  } catch (error) {
    console.error('Failed to initialize PostHog client:', error);
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
      console.log('Flushed PostHog events due to server error');
    } catch (error) {
      console.error('PostHog flush failed for error response:', error);
      consecutiveFailures++;
      lastFailureTime = Date.now();
    }
  }
  
  // In Fluid Compute, we can afford to track performance metrics
  if (client && c.res) {
    const duration = Date.now() - startTime;
    
    // Only track slow requests to avoid noise
    if (duration > 1000) { // 1 second threshold
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
  if (!posthogClient) return;
  
  try {
    await posthogClient.flush();
    consecutiveFailures = 0; // Reset on successful flush
  } catch (error) {
    console.error('PostHog flush error:', error);
    consecutiveFailures++;
    lastFailureTime = Date.now();
  }
}

/**
 * Graceful shutdown for container recycling.
 * This is CRITICAL in Fluid Compute to avoid losing batched events.
 */
export async function shutdownPostHog(): Promise<void> {
  if (!posthogClient) return;
  
  try {
    console.log('Shutting down PostHog client...');
    await posthogClient.shutdown();
    posthogClient = null;
    console.log('PostHog shutdown complete');
  } catch (error) {
    console.error('PostHog shutdown error:', error);
  }
}

/**
 * Register shutdown handlers for Vercel container lifecycle.
 * These ensure batched events are sent before the process exits.
 */
if (typeof process !== 'undefined') {
  // SIGTERM is sent by Vercel before container recycling
  process.once('SIGTERM', async () => {
    console.log('SIGTERM received, flushing PostHog events...');
    await shutdownPostHog();
  });

  // beforeExit catches normal process termination
  process.once('beforeExit', async () => {
    console.log('Process exiting, flushing PostHog events...');
    await shutdownPostHog();
  });
}

/**
 * Optional: Periodic health check and flush for long-running containers.
 * This ensures events are sent even during quiet periods.
 */
let healthCheckInterval: NodeJS.Timeout | null = null;

export function startPeriodicHealthCheck(intervalMs: number = 60000): void {
  if (healthCheckInterval) return; // Already running
  
  healthCheckInterval = setInterval(async () => {
    if (!posthogClient) return;
    
    try {
      // Check if we have pending events (PostHog doesn't expose this directly,
      // but we can infer from successful flush)
      await posthogClient.flush();
      consecutiveFailures = 0;
    } catch (error) {
      console.error('Periodic PostHog health check failed:', error);
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