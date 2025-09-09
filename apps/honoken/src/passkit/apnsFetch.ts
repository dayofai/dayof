import { createBoundedMap } from '@honoken/utils/bounded-cache';
import { importPKCS8, SignJWT } from 'jose';
import pRetry, { type Options as PRetryOpts } from 'p-retry';
import { Agent, fetch as undiciFetch } from 'undici';
import { loadApnsKeyData } from './apnsKeys';
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

import { createHash } from 'node:crypto';
import { getDbClient } from '@honoken/db';
import type { Env } from '@honoken/types';
import type { Logger } from '@honoken/utils/logger';
import type { PostHog } from 'posthog-node';

/* -------------------------------------------------------------------------- */
/* Helper Functions                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Hash device ID for privacy-preserving tracking in PostHog
 */
function hashDeviceId(deviceId: string | undefined): string {
  if (!deviceId) {
    return 'unknown';
  }
  return createHash('sha256').update(deviceId).digest('hex').substring(0, 16);
}

/* -------------------------------------------------------------------------- */
/* Constants & Configuration                                                  */
/* -------------------------------------------------------------------------- */

const APNS_PROD = 'https://api.push.apple.com';
const APNS_DEV = 'https://api.sandbox.push.apple.com';
const TOKEN_TTL_SEC = 60 * 20; // 20 minutes (Apple recommends ≤ 60)
const JWT_REFRESH_BEFORE_SEC = 30; // Refresh if <30s left

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
  triggeredByKeyCacheInvalidation = false
): void {
  const cacheKey = `${teamId}:${keyId}`;
  tokenCache.delete(cacheKey);

  // Close and remove all HTTP/2 agents to ensure fresh connections with new credentials
  // This prevents stale ALPN session tickets from being used with invalidated tokens
  for (const [host, agent] of h2Agents) {
    try {
      // Note: agent.close() is async but we don't await to avoid blocking
      // The agent will close connections gracefully in the background
      agent.close().catch((error) => {
        logger.error('Failed to close h2Agent during cache invalidation', {
          host,
          error: error instanceof Error ? error.message : String(error),
        });
      });
      h2Agents.delete(host);
    } catch (error) {
      logger.error('Error removing h2Agent during cache invalidation', {
        host,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info(
    'Invalidated APNs provider token cache and closed HTTP/2 agents',
    {
      teamId,
      keyId,
      triggeredByKeyCacheInvalidation,
      agentsClosed: h2Agents.size,
    }
  );

  // Note: Key cache coordination is handled by the apnsKeys module
  // This parameter ensures we don't create circular invalidation loops
}

/* -------------------------------------------------------------------------- */
/* Multi-tenant Key Lookup                                                   */
/* -------------------------------------------------------------------------- */
async function getApnsKeyForTopic(env: Env, topic: string, logger: Logger) {
  const db = getDbClient(env, logger);

  // Relational query (RQB v2) — use object-style where per docs
  // https://rqbv2.drizzle-orm-fe.pages.dev/docs/rqb-v2
  const passType = await db.query.walletPassType.findFirst({
    where: { passTypeIdentifier: topic },
    with: {
      cert: {
        columns: { teamId: true },
      },
    },
  });

  if (!passType?.cert) {
    throw new Error(`Pass type or certificate not found for topic ${topic}`);
  }

  // Find the active APNs key for this team
  const activeKey = await db.query.walletApnsKey.findFirst({
    where: { teamId: passType.cert.teamId, isActive: true },
  });

  if (!activeKey) {
    throw new Error(
      `Active APNs key not found for team ${passType.cert.teamId}`
    );
  }

  const keyData = await loadApnsKeyData(activeKey.keyRef, env, logger);
  if (!keyData) {
    throw new Error(`Unable to load APNs keyRef ${activeKey.keyRef}`);
  }

  return {
    keyRef: activeKey.keyRef,
    teamId: activeKey.teamId,
    keyId: activeKey.keyId,
    p8Pem: keyData.p8Pem,
  };
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
  if (agent) {
    return agent;
  }

  // Create a new agent for this specific host (prod or sandbox)
  agent = new Agent({
    // Reduced timeouts to limit socket lifetime while maintaining performance
    keepAliveTimeout: 10_000, // 10s (reduced from 60s)
    keepAliveMaxTimeout: 30_000, // 30s (reduced from 300s)
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
  if (status === 500 || status === 503 || status === 429) {
    return 'retryable';
  }

  // Device unregistered
  if (status === 410) {
    return 'unregistered';
  }
  if (reason === 'Unregistered' || reason === 'BadDeviceToken') {
    return 'unregistered';
  }

  // Fatal auth/key errors (invalidate cache)
  if (status === 401 || status === 403) {
    return 'fatal';
  }

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
  const res = await undiciFetch(`${opts.host}/3/device/${device.pushToken}`, {
    method: 'POST',
    dispatcher: opts.agent,
    headers: {
      authorization: `bearer ${opts.jwt}`,
      'apns-topic': opts.topic,
      'apns-push-type': 'background',
      'apns-priority': '5',
    },
    body: '{}',
  });

  const reason = (await res.text()) || res.headers.get('apns-error') || '';
  const retryAfter = res.headers.get('retry-after');
  return { status: res.status, reason, retryAfter };
}

type RetryError = Error & {
  retryable?: boolean;
  attemptNumber?: number;
  retryAfterMs?: number;
  retriesLeft?: number;
};

function getRetryAfterMs(retryAfter: string | null): number | undefined {
  if (!retryAfter) {
    return;
  }
  const secs = Number.parseInt(retryAfter, 10);
  if (!Number.isNaN(secs)) {
    return secs * 1000;
  }
  const dateMs = Date.parse(retryAfter);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return;
}

function handleFatalAuthFailure(
  teamId: string,
  keyId: string,
  status: number,
  reason: string,
  logger: Logger
): void {
  const failureKey = `${teamId}:${keyId}`;
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
  logger.warn('APNs auth/key fatal; invalidating cache', {
    status,
    reason,
    teamId,
    keyId,
    failureCount: failure.count,
    circuitBreakerOpen: failure.count >= AUTH_FAILURE_THRESHOLD,
  });
  invalidateApnsClientCache(teamId, keyId, logger);
}

/* -------------------------------------------------------------------------- */
/* Helper functions for sendWithRetry                                        */
/* -------------------------------------------------------------------------- */

function createRetryOptions(
  onFailedAttempt: PRetryOpts['onFailedAttempt']
): PRetryOpts {
  return {
    retries: 5,
    factor: 2,
    minTimeout: 500,
    maxTimeout: 30_000,
    randomize: true, // Jitter
    shouldRetry: (err) =>
      !!err &&
      typeof err === 'object' &&
      (err as Partial<RetryError>).retryable === true,
    onFailedAttempt,
  };
}

function createRetryError(
  status: number,
  reason: string,
  retryAfter: string | null,
  attemptCount: number
): RetryError {
  const err: RetryError = new Error(`Retryable APNs ${status}: ${reason}`);
  err.retryable = true;

  // Honor Retry-After header for 429 responses
  if (status === 429) {
    const ms = getRetryAfterMs(retryAfter);
    if (ms !== undefined) {
      err.attemptNumber = attemptCount;
      err.retryAfterMs = ms;
    }
  }

  return err;
}

function trackDeviceUnregistration(
  device: DeviceRegistration,
  ctx: {
    topic: string;
    teamId: string;
    posthog?: PostHog;
  },
  reason: string,
  status: number
): void {
  if (!ctx.posthog) {
    return;
  }

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
    },
  });
}

function trackPushFailure(
  device: DeviceRegistration,
  ctx: {
    topic: string;
    teamId: string;
    posthog?: PostHog;
  },
  error: Error,
  attemptCount: number,
  totalTime: number
): void {
  if (!ctx.posthog || attemptCount < 2) {
    return;
  }

  const hashedDeviceId = hashDeviceId(device.deviceId || device.pushToken);
  ctx.posthog.capture({
    distinctId: hashedDeviceId,
    event: 'push_failed',
    properties: {
      passType: ctx.topic,
      teamId: ctx.teamId,
      errorMessage: error.message || 'Unknown error',
      attempts: attemptCount,
      totalTimeMs: totalTime,
      hashedDeviceId,
    },
  });
}

function handlePushSuccess(
  ctx: { teamId: string; keyId: string; logger: Logger },
  status: number,
  attemptCount: number,
  startTime: number,
  classification: string
): void {
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
      hadRetries: attemptCount > 1,
    });
  }
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

  const retryOpts = createRetryOptions(async (context) => {
    attemptCount++;
    const error = context.error as Error & Partial<RetryError>;
    const retryAfterMs = error.retryAfterMs;

    if (retryAfterMs && retryAfterMs > 0) {
      ctx.logger.info('APNs retry with Retry-After header', {
        attempt: attemptCount,
        error: error.message,
        retriesLeft: context.retriesLeft,
        retryAfterMs,
        elapsed: Date.now() - startTime,
      });
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
    } else {
      ctx.logger.info('APNs retry attempt', {
        attempt: attemptCount,
        error: error.message,
        retriesLeft: context.retriesLeft,
        elapsed: Date.now() - startTime,
      });
    }
  });

  const outcome = await pRetry(async () => {
    attemptCount++;
    const { status, reason, retryAfter } = await sendOnce(device, ctx);
    const classification = classifyApnsError(status, reason);

    if (classification === 'retryable') {
      throw createRetryError(status, reason, retryAfter, attemptCount);
    }

    if (classification === 'fatal') {
      handleFatalAuthFailure(ctx.teamId, ctx.keyId, status, reason, ctx.logger);
    }

    handlePushSuccess(ctx, status, attemptCount, startTime, classification);

    const result: PushResult = {
      ok: status === 200,
      unregistered: classification === 'unregistered',
      reason: classification !== 'unregistered' ? reason : undefined,
    };

    if (classification === 'unregistered') {
      trackDeviceUnregistration(device, ctx, reason, status);
    }

    return { ...device, result };
  }, retryOpts).catch((err) => {
    const shouldSentryReport = attemptCount >= 3;

    if (shouldSentryReport) {
      ctx.logger.error('APNs push failed after retries', err, {
        attempts: attemptCount,
        totalTime: Date.now() - startTime,
        finalError: err.message,
        severity: 'critical_warn',
      });
    } else {
      ctx.logger.warn('APNs push failed', {
        attempts: attemptCount,
        totalTime: Date.now() - startTime,
        finalError: err.message,
      });
    }

    trackPushFailure(device, ctx, err, attemptCount, Date.now() - startTime);

    return {
      ...device,
      result: { ok: false, reason: err.message || 'Retries exhausted' },
    };
  });

  return outcome;
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
      summary: { attempted: 0, succeeded: 0, unregistered: 0, failed: 0 },
    };
  }

  // Get keys and setup
  const { teamId, keyId, p8Pem } = await getApnsKeyForTopic(env, topic, logger);

  // Check circuit breaker before attempting to generate JWT
  const failureKey = `${teamId}:${keyId}`;
  const now = Date.now();
  const failure = authFailures.get(failureKey);

  if (
    failure &&
    failure.count >= AUTH_FAILURE_THRESHOLD &&
    now < failure.resetAt
  ) {
    const timeUntilReset = Math.ceil((failure.resetAt - now) / 1000);
    logger.error('APNs authentication circuit breaker open', {
      teamId,
      keyId,
      failureCount: failure.count,
      timeUntilResetSeconds: timeUntilReset,
    });
    throw new Error(
      `APNs authentication circuit breaker open for ${failureKey} - ${timeUntilReset}s until reset`
    );
  }

  const jwt = await getProviderToken(teamId, keyId, p8Pem);
  const host = env.ENVIRONMENT === 'development' ? APNS_DEV : APNS_PROD;
  const agent = getH2Agent(host);

  // Process all devices in parallel
  const outcomes = await Promise.all(
    regs.map((device) =>
      sendWithRetry(device, {
        jwt,
        topic,
        host,
        agent,
        logger,
        teamId,
        keyId,
        posthog,
      })
    )
  );

  // Generate summary
  const summary: BatchReport['summary'] = {
    attempted: regs.length,
    succeeded: outcomes.filter((o: PushOutcome) => o.result.ok).length,
    unregistered: outcomes.filter((o: PushOutcome) => o.result.unregistered)
      .length,
    failed: outcomes.filter(
      (o: PushOutcome) => !(o.result.ok || o.result.unregistered)
    ).length,
  };

  // Log batch-level metrics for monitoring (only if significant issues or large batches)
  const failureRate = summary.failed / summary.attempted;
  const shouldLogBatch =
    summary.attempted > 10 || failureRate > 0.1 || summary.failed > 0;

  if (shouldLogBatch) {
    const logLevel = failureRate > 0.2 ? 'warn' : 'info';
    logger[logLevel]('APNs batch completed', {
      ...summary,
      failureRate: Math.round(failureRate * 100) / 100,
      topic,
      batchSize: regs.length,
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
  const closers: Promise<void>[] = [];
  for (const [host, agent] of h2Agents) {
    closers.push(
      agent
        .close()
        .catch(() => {
          /* ignore */
        })
        .then(() => {
          h2Agents.delete(host);
        })
    );
  }
  await Promise.all(closers);
});

// Also handle explicit termination signals in case they're sent
process.on('SIGTERM', async () => {
  const closers: Promise<void>[] = [];
  for (const [host, agent] of h2Agents) {
    closers.push(
      agent
        .close()
        .catch(() => {
          /* ignore */
        })
        .then(() => {
          h2Agents.delete(host);
        })
    );
  }
  await Promise.all(closers);
});
