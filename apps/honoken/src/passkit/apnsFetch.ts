import { createBoundedMap } from '@honoken/utils/bounded-cache';
import { importPKCS8, SignJWT } from 'jose';
import pRetry, { type Options as PRetryOpts } from 'p-retry';
// NOTE: Apple APNs requires HTTP/2. The previous implementation used undici (HTTP/1.1) which can
// produce malformed responses / connection errors. We switch to native http2 for compliance.
// Removed undici Agent usage after migrating to native http2
import * as http2 from 'node:http2';
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

// HTTP/2 session pool per host. We keep a small map of active sessions and lazily create.
// Sessions are auto-destroyed on error/close and recreated on demand.
const h2Sessions = new Map<string, http2.ClientHttp2Session>();

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
  // Close all existing sessions so new credentials take effect
  for (const [host, session] of h2Sessions) {
    try {
      session.close();
    } catch (error) {
      logger.error('Error closing HTTP/2 session during cache invalidation', {
        host,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      h2Sessions.delete(host);
    }
  }

  logger.info('Invalidated APNs provider token cache and closed HTTP/2 sessions', {
    teamId,
    keyId,
    triggeredByKeyCacheInvalidation,
    activeSessionsAfter: h2Sessions.size,
  });

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
function getH2Session(host: string, logger?: Logger): http2.ClientHttp2Session {
  let session = h2Sessions.get(host);
  if (session && !session.closed && !session.destroyed) return session;

  // Ensure previous dirty session removed
  if (session) {
    try { session.destroy(); } catch {/* ignore */}
    h2Sessions.delete(host);
  }

  session = http2.connect(host, {
    // ALPN handled automatically; Bun/Node will negotiate h2.
  });
  session.setTimeout(30_000, () => {
    try { session?.close(); } catch {/* ignore */}
  });
  session.on('error', (err) => {
    logger?.error('APNs HTTP/2 session error', err instanceof Error ? err : new Error(String(err)), { host });
    try { session?.destroy(); } catch {/* ignore */}
    h2Sessions.delete(host);
  });
  session.on('close', () => {
    h2Sessions.delete(host);
  });
  h2Sessions.set(host, session);
  return session;
}

/* -------------------------------------------------------------------------- */
/* Error Classification & Handling                                           */
/* -------------------------------------------------------------------------- */
function classifyApnsError(
  status: number,
  reason: string
): 'success' | 'retryable' | 'unregistered' | 'fatal' {
  // Explicit success
  if (status === 200) return 'success';
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
  opts: { jwt: string; topic: string; host: string; logger: Logger }
) {
  // Always use production host for Wallet passes; Apple's docs note sandbox does not deliver for active passes.
  const host = APNS_PROD;
  const session = getH2Session(host, opts.logger);
  const path = `/3/device/${device.pushToken}`;

  return await new Promise<{ status: number; reason: string; retryAfter: string | null }>((resolve) => {
    let responded = false;
    const headers: http2.OutgoingHttpHeaders = {
      ':method': 'POST',
      ':path': path,
      authorization: `bearer ${opts.jwt}`,
      'apns-topic': opts.topic,
      'apns-push-type': 'background', // For pass updates background is acceptable
      'apns-priority': '5',
      'content-length': '2',
      'content-type': 'application/json',
    };
    const req = session.request(headers, { endStream: false });
    let status = 0;
    let dataBuf = '';
    let retryAfter: string | null = null;

    req.on('response', (h) => {
      status = Number(h[':status'] || 0);
      if (h['retry-after']) retryAfter = String(h['retry-after']);
    });
    req.setEncoding('utf8');
    req.on('data', (chunk) => { dataBuf += chunk; });
    req.on('error', (err) => {
      if (responded) return;
      responded = true;
      opts.logger.error('APNs HTTP/2 request error', err, { path });
      resolve({ status: 500, reason: err.message || 'http2_error', retryAfter: null });
    });
    req.on('close', () => {
      if (responded) return;
      responded = true;
      let reason = '';
      if (dataBuf.trim()) {
        try {
          const parsed = JSON.parse(dataBuf);
            reason = parsed.reason || dataBuf;
        } catch {
          reason = dataBuf;
        }
      }
      resolve({ status, reason, retryAfter });
    });
    req.write('{}');
    req.end();
  });
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
    host: string; // retained for logging; actual host forced to prod in sendOnce
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
      ok: classification === 'success',
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
  // Force production host for Wallet passes (sandbox does not deliver active pass updates)
  const host = APNS_PROD;

  // Process all devices in parallel
  const outcomes = await Promise.all(
    regs.map((device) =>
      sendWithRetry(device, {
        jwt,
        topic,
        host,
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

  if (
    summary.failed === 0 &&
    summary.unregistered === 0 &&
    summary.attempted > 0 &&
    summary.attempted <= 10
  ) {
    logger.info('APNs batch success', {
      ...summary,
      topic,
      host,
    });
  }

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

  // Per-device outcome logging (small batches only) with hashed device ID for privacy
  if (regs.length <= 10) {
    outcomes.forEach((o) => {
      const hashed = hashDeviceId(o.deviceId || o.pushToken);
      logger.info('apns_device_outcome', {
        passType: topic,
        device: hashed,
        ok: o.result.ok,
        unregistered: !!o.result.unregistered,
        reason: o.result.reason,
      });
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
function closeAllSessions() {
  for (const [host, session] of h2Sessions) {
    try { session.close(); } catch {/* ignore */}
    h2Sessions.delete(host);
  }
}

process.on('beforeExit', closeAllSessions);
process.on('SIGTERM', closeAllSessions);
