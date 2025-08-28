import { Agent, fetch as undiciFetch } from 'undici';
import { SignJWT, importPKCS8 } from 'jose';
import pRetry, { Options as PRetryOpts } from 'p-retry';
import {
  createBoundedMap,
} from '../utils/bounded-cache';
import {
  loadApnsKeyData
} from './apnsKeys';
// Types moved inline since original APNs module was removed
export interface DeviceRegistration {
  pushToken: string;
  deviceId?: string; // Make deviceId optional but recommended (compatible with existing apns.ts)
  [extra: string]: unknown;
}

export interface PushResult {
  ok: boolean;
  unregistered?: boolean;
  reason?: string;
  error?: string; // Additional error field for enhanced error reporting
}

export interface PushOutcome extends DeviceRegistration {
  result: PushResult;
}

export interface BatchReport {
  outcomes: PushOutcome[];
  summary: {
    attempted: number;
    succeeded: number;
    unregistered: number;
    failed: number;
  };
}
import { Env } from '../types';
import { getDbClient, schema } from '../db';
import { and, eq } from 'drizzle-orm';
import type { Logger } from '../utils/logger';
import type { PostHog } from 'posthog-node';
import { createHash } from 'crypto';

/* -------------------------------------------------------------------------- */
/* Helper Functions                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Hash device ID for privacy-preserving tracking in PostHog
 */
function hashDeviceId(deviceId: string | undefined): string {
  if (!deviceId) return 'unknown';
  return createHash('sha256').update(deviceId).digest('hex').substring(0, 16);
}

/* -------------------------------------------------------------------------- */
/* Constants & Configuration                                                  */
/* -------------------------------------------------------------------------- */

const APNS_PROD = 'https://api.push.apple.com';
const APNS_DEV  = 'https://api.sandbox.push.apple.com';
const TOKEN_TTL_SEC = 60 * 20;      // 20 minutes (Apple recommends ≤ 60)
const JWT_REFRESH_BEFORE_SEC = 30;  // Refresh if <30s left

/* -------------------------------------------------------------------------- */
/* In-Memory Caches (Bounded for Memory Management)                          */
/* -------------------------------------------------------------------------- */

// Provider token cache: teamId-keyId → {jwt, exp}
const tokenCache = createBoundedMap<string, { jwt: string; exp: number }>();

// HTTP/2 agents per host (prevents socket explosion while isolating prod/sandbox)
// Module-level map to maintain separate agents for each APNs environment
const h2Agents = new Map<string, Agent>();

// Circuit breaker for auth failures: teamId-keyId → {count, resetAt}
const authFailures = new Map<string, { count: number; resetAt: number }>();
const AUTH_FAILURE_THRESHOLD = 3;
const AUTH_FAILURE_RESET_MS = 5 * 60 * 1000; // 5 minutes

/* -------------------------------------------------------------------------- */
/* Cache Invalidation Helper                                                 */
/* -------------------------------------------------------------------------- */
export function invalidateApnsClientCache(
  teamId: string, 
  keyId: string, 
  logger: Logger, 
  triggeredByKeyCacheInvalidation: boolean = false
): void {
  const cacheKey = `${teamId}:${keyId}`;
  tokenCache.delete(cacheKey);
  
  // Close and remove all HTTP/2 agents to ensure fresh connections with new credentials
  // This prevents stale ALPN session tickets from being used with invalidated tokens
  for (const [host, agent] of h2Agents) {
    try {
      // Note: agent.close() is async but we don't await to avoid blocking
      // The agent will close connections gracefully in the background
      agent.close().catch(error => {
        logger.error('Failed to close h2Agent during cache invalidation', { 
          host, 
          error: error instanceof Error ? error.message : String(error) 
        });
      });
      h2Agents.delete(host);
    } catch (error) {
      logger.error('Error removing h2Agent during cache invalidation', { 
        host, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  logger.info('Invalidated APNs provider token cache and closed HTTP/2 agents', { 
    teamId, 
    keyId, 
    triggeredByKeyCacheInvalidation,
    agentsClosed: h2Agents.size
  });
  
  // Note: Key cache coordination is handled by the apnsKeys module
  // This parameter ensures we don't create circular invalidation loops
}

/* -------------------------------------------------------------------------- */
/* Multi-tenant Key Lookup                                                   */
/* -------------------------------------------------------------------------- */
async function getApnsKeyForTopic(
  env: Env,
  topic: string,
  logger: Logger
) {
  const db = getDbClient(env, logger);

  const row = await db
    .select({
      keyRef: schema.apnsKeys.keyRef,
      teamId: schema.apnsKeys.teamId,
      keyId: schema.apnsKeys.keyId
    })
    .from(schema.passTypes)
    .innerJoin(schema.certs, eq(schema.passTypes.certRef, schema.certs.certRef))
    .innerJoin(schema.apnsKeys, eq(schema.certs.teamId, schema.apnsKeys.teamId))
    .where(and(
      eq(schema.passTypes.passTypeIdentifier, topic),
      eq(schema.apnsKeys.isActive, true)
    ))
    .limit(1)
    .then(r => r[0]);

  if (!row) {
    throw new Error(`APNs key not found for topic ${topic}`);
  }

  // Load encrypted P8 from existing system
  const keyData = await loadApnsKeyData(row.keyRef, env, logger);
  if (!keyData) {
    throw new Error(`Unable to load APNs keyRef ${row.keyRef}`);
  }

  return { ...row, p8Pem: keyData.p8Pem };
}

/* -------------------------------------------------------------------------- */
/* JWT Provider Token Management                                              */
/* -------------------------------------------------------------------------- */
async function getProviderToken(
  teamId: string,
  keyId: string,
  p8Pem: string
): Promise<string> {
  const cacheKey = `${teamId}:${keyId}`;
  const now = Math.floor(Date.now() / 1000);

  // Check cache for valid token
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.exp - JWT_REFRESH_BEFORE_SEC > now) {
    return cached.jwt;
  }

  // Generate new JWT
  const pkcs8 = await importPKCS8(p8Pem, 'ES256');
  const exp = now + TOKEN_TTL_SEC;

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuedAt(now)
    .setIssuer(teamId)
    .setExpirationTime(exp)
    .sign(pkcs8);

  tokenCache.set(cacheKey, { jwt, exp });
  return jwt;
}

/* -------------------------------------------------------------------------- */
/* HTTP/2 Connection Pooling (Socket Explosion Fix)                         */
/* -------------------------------------------------------------------------- */
function getH2Agent(host: string): Agent {
  // Check if we already have an agent for this host
  let agent = h2Agents.get(host);
  if (agent) return agent;

  // Create a new agent for this specific host (prod or sandbox)
  agent = new Agent({
    // Reduced timeouts to limit socket lifetime while maintaining performance
    keepAliveTimeout: 10_000,    // 10s (reduced from 60s)
    keepAliveMaxTimeout: 30_000  // 30s (reduced from 300s)
  });

  // Store for reuse - maintains separate agents for prod vs sandbox
  h2Agents.set(host, agent);
  return agent;
}

/* -------------------------------------------------------------------------- */
/* Error Classification & Handling                                           */
/* -------------------------------------------------------------------------- */
function classifyApnsError(
  status: number,
  reason: string
): 'retryable' | 'unregistered' | 'fatal' {
  // Retryable server errors
  if (status === 500 || status === 503 || status === 429) return 'retryable';
  
  // Device unregistered
  if (status === 410) return 'unregistered';
  if (reason === 'Unregistered' || reason === 'BadDeviceToken') return 'unregistered';
  
  // Fatal auth/key errors (invalidate cache)
  if (status === 401 || status === 403) return 'fatal';
  
  return 'fatal';
}

/* -------------------------------------------------------------------------- */
/* Core APNs Sender with Retry Logic                                         */
/* -------------------------------------------------------------------------- */
async function sendOnce(
  device: DeviceRegistration,
  opts: {
    jwt: string;
    topic: string;
    host: string;
    agent: Agent;
  }
) {
  const res = await undiciFetch(
    `${opts.host}/3/device/${device.pushToken}`,
    {
      method: 'POST',
      dispatcher: opts.agent,
      headers: {
        authorization: `bearer ${opts.jwt}`,
        'apns-topic': opts.topic,
        'apns-push-type': 'background',
        'apns-priority': '5'
      },
      body: '{}'
    }
  );

  const reason = (await res.text()) || res.headers.get('apns-error') || '';
  const retryAfter = res.headers.get('retry-after');
  return { status: res.status, reason, retryAfter };
}

async function sendWithRetry(
  device: DeviceRegistration,
  ctx: {
    jwt: string;
    topic: string;
    host: string;
    agent: Agent;
    logger: Logger;
    teamId: string;
    keyId: string;
    posthog?: PostHog;
  }
): Promise<PushOutcome> {
  const startTime = Date.now();
  let attemptCount = 0;
  
  const retryOpts: PRetryOpts = {
    retries: 5,
    factor: 2,
    minTimeout: 500,
    maxTimeout: 30_000,
    randomize: true, // Jitter
    shouldRetry: (err) =>
      err && typeof err === 'object' &&
      (err as any).retryable === true,
    onFailedAttempt: async (error) => {
      attemptCount++;
      
      // Check if we have a Retry-After directive and wait accordingly
      const retryAfterMs = (error as any).retryAfterMs;
      if (retryAfterMs && retryAfterMs > 0) {
        ctx.logger.info('APNs retry with Retry-After header', {
          attempt: attemptCount,
          error: error.message,
          retriesLeft: error.retriesLeft,
          retryAfterMs,
          elapsed: Date.now() - startTime
        });
        
        // Honor the server's Retry-After directive by waiting
        // p-retry will still add its own delay on top, but at least we respect the minimum
        await new Promise(resolve => setTimeout(resolve, retryAfterMs));
      } else {
        // Use info() to avoid Sentry noise on normal retry attempts
        ctx.logger.info('APNs retry attempt', {
          attempt: attemptCount,
          error: error.message,
          retriesLeft: error.retriesLeft,
          elapsed: Date.now() - startTime
        });
      }
    }
  };

  return pRetry(async () => {
    attemptCount++;
    const { status, reason, retryAfter } = await sendOnce(device, ctx);

    const classification = classifyApnsError(status, reason);
    if (classification === 'retryable') {
      const err = new Error(`Retryable APNs ${status}: ${reason}`) as any;
      err.retryable = true;
      
      // Honor Retry-After header for 429 responses
      if (status === 429 && retryAfter) {
        // Retry-After can be in seconds (number) or HTTP-date format
        // NOTE: We intentionally only parse numeric seconds format (not HTTP-date)
        // This is a YAGNI decision since:
        // 1. Apple's APNs documentation doesn't officially mention Retry-After headers
        // 2. Most services use numeric seconds for simplicity
        // 3. This defensive code handles the most common case if Apple adds it
        const retryAfterSeconds = parseInt(retryAfter, 10);
        if (!isNaN(retryAfterSeconds)) {
          // Override p-retry's exponential backoff with server's directive
          err.attemptNumber = attemptCount;
          err.retryAfterMs = retryAfterSeconds * 1000;
        }
      }
      
      throw err;
    }

    if (classification === 'fatal') {
      // Track auth failures for circuit breaker
      const failureKey = `${ctx.teamId}:${ctx.keyId}`;
      const now = Date.now();
      const failure = authFailures.get(failureKey) || { count: 0, resetAt: 0 };
      
      // Reset counter if cooldown period has passed
      if (now >= failure.resetAt) {
        failure.count = 0;
      }
      
      // Increment failure count
      failure.count++;
      failure.resetAt = now + AUTH_FAILURE_RESET_MS;
      authFailures.set(failureKey, failure);
      
      // Invalidate token cache for 401/403 errors
      ctx.logger.warn('APNs auth/key fatal; invalidating cache', {
        status, 
        reason, 
        teamId: ctx.teamId, 
        keyId: ctx.keyId,
        failureCount: failure.count,
        circuitBreakerOpen: failure.count >= AUTH_FAILURE_THRESHOLD
      });
      invalidateApnsClientCache(ctx.teamId, ctx.keyId, ctx.logger);
    }

    // Reset auth failure counter on successful request
    if (status === 200) {
      const failureKey = `${ctx.teamId}:${ctx.keyId}`;
      authFailures.delete(failureKey);
    }
    
    // Log successful completion with metrics
    // Only log if there were retries or unusual timing to reduce noise
    if (attemptCount > 1 || Date.now() - startTime > 2000) {
      ctx.logger.info('APNs push completed after retries', {
        attempts: attemptCount,
        totalTime: Date.now() - startTime,
        status,
        classification,
        hadRetries: attemptCount > 1
      });
    }

    const result: PushResult = {
      ok: status === 200,
      unregistered: classification === 'unregistered',
      reason: classification !== 'unregistered' ? reason : undefined
    };

    // Track device unregistration in PostHog
    if (classification === 'unregistered' && ctx.posthog) {
      const hashedDeviceId = hashDeviceId(device.deviceId || device.pushToken);
      ctx.posthog.capture({
        distinctId: hashedDeviceId,
        event: 'device_unregistered',
        properties: {
          passType: ctx.topic,
          teamId: ctx.teamId,
          reason: reason || 'Unknown',
          status,
          hashedDeviceId,
        }
      });
    }

    return { ...device, result };

  }, retryOpts).catch(err => {
    // All retries exhausted - determine severity for Sentry
    const shouldSentryReport = attemptCount >= 3; // Only report to Sentry if we made significant retry attempts
    
    if (shouldSentryReport) {
      ctx.logger.error('APNs push failed after retries', err, {
        attempts: attemptCount,
        totalTime: Date.now() - startTime,
        finalError: err.message,
        severity: 'critical_warn' // Explicit Sentry elevation
      });
    } else {
      // Single failures might be temporary device issues, not system problems
      ctx.logger.warn('APNs push failed', {
        attempts: attemptCount,
        totalTime: Date.now() - startTime,
        finalError: err.message
      });
    }
    
    // Track persistent push failures in PostHog
    if (ctx.posthog && attemptCount >= 2) { // Only track if we tried at least twice
      const hashedDeviceId = hashDeviceId(device.deviceId || device.pushToken);
      ctx.posthog.capture({
        distinctId: hashedDeviceId,
        event: 'push_failed',
        properties: {
          passType: ctx.topic,
          teamId: ctx.teamId,
          errorMessage: err.message || 'Unknown error',
          attempts: attemptCount,
          totalTimeMs: Date.now() - startTime,
          hashedDeviceId,
        }
      });
    }
    
    return {
      ...device,
      result: { ok: false, reason: err.message || 'Retries exhausted' }
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Public Batch API - Drop-in Replacement                                    */
/* -------------------------------------------------------------------------- */
export async function pushToManyFetch(
  env: Env,
  regs: DeviceRegistration[],
  topic: string,
  logger: Logger,
  posthog?: PostHog
): Promise<BatchReport> {
  if (regs.length === 0) {
    return { 
      outcomes: [], 
      summary: { attempted: 0, succeeded: 0, unregistered: 0, failed: 0 } 
    };
  }

  // Get keys and setup
  const { teamId, keyId, p8Pem } = await getApnsKeyForTopic(env, topic, logger);
  
  // Check circuit breaker before attempting to generate JWT
  const failureKey = `${teamId}:${keyId}`;
  const now = Date.now();
  const failure = authFailures.get(failureKey);
  
  if (failure && failure.count >= AUTH_FAILURE_THRESHOLD && now < failure.resetAt) {
    const timeUntilReset = Math.ceil((failure.resetAt - now) / 1000);
    logger.error('APNs authentication circuit breaker open', {
      teamId,
      keyId,
      failureCount: failure.count,
      timeUntilResetSeconds: timeUntilReset
    });
    throw new Error(`APNs authentication circuit breaker open for ${failureKey} - ${timeUntilReset}s until reset`);
  }
  
  const jwt = await getProviderToken(teamId, keyId, p8Pem);
  const host = env.ENVIRONMENT === 'development' ? APNS_DEV : APNS_PROD;
  const agent = getH2Agent(host);

  // Process all devices in parallel
  const outcomes = await Promise.all(
    regs.map(device => sendWithRetry(device, { 
      jwt, topic, host, agent, logger, teamId, keyId, posthog 
    }))
  );

  // Generate summary
  const summary: BatchReport['summary'] = {
    attempted: regs.length,
    succeeded: outcomes.filter((o: PushOutcome) => o.result.ok).length,
    unregistered: outcomes.filter((o: PushOutcome) => o.result.unregistered).length,
    failed: outcomes.filter((o: PushOutcome) => !o.result.ok && !o.result.unregistered).length
  };

  // Log batch-level metrics for monitoring (only if significant issues or large batches)
  const failureRate = summary.failed / summary.attempted;
  const shouldLogBatch = summary.attempted > 10 || failureRate > 0.1 || summary.failed > 0;
  
  if (shouldLogBatch) {
    const logLevel = failureRate > 0.2 ? 'warn' : 'info';
    logger[logLevel]('APNs batch completed', {
      ...summary,
      failureRate: Math.round(failureRate * 100) / 100,
      topic,
      batchSize: regs.length
    });
  }

  return { outcomes, summary };
}

// Export with original name for drop-in replacement
export const pushToMany = pushToManyFetch; 

/* -------------------------------------------------------------------------- */
/* Graceful Shutdown for Vercel Hot-Swaps                                    */
/* -------------------------------------------------------------------------- */

// Handle graceful shutdown to prevent connection leaks during Vercel deployments
process.on('beforeExit', async () => {
  for (const [host, agent] of h2Agents) {
    try {
      await agent.close();
      h2Agents.delete(host);
    } catch (error) {
      // Log but don't throw - we're shutting down anyway
      console.error(`Error closing HTTP/2 agent for ${host} during shutdown:`, error);
    }
  }
});

// Also handle explicit termination signals in case they're sent
process.on('SIGTERM', async () => {
  for (const [host, agent] of h2Agents) {
    try {
      await agent.close();
      h2Agents.delete(host);
    } catch (error) {
      console.error(`Error closing HTTP/2 agent for ${host} during SIGTERM:`, error);
    }
  }
}); 