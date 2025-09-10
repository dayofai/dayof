import { schema as sharedSchema } from 'database/schema';
import { eq } from 'drizzle-orm';
import { getDbClient } from '../db/index';
import type { Env } from '../types';
import { createBoundedMap } from '../utils/bounded-cache';
import { decryptWithVersion, encryptWithVersion } from '../utils/crypto';
import type { Logger } from '../utils/logger';

/**
 * Represents loaded APNs key data for push notifications.
 */
export type ApnsKeyData = {
  teamId: string;
  keyId: string;
  p8Pem: string; // The decrypted .p8 PEM string
};

// APNs key cache with size limit (max 100 entries, no TTL needed - we do DB timestamp validation)
export const apnsKeyCache = createBoundedMap<
  string,
  { data: ApnsKeyData; dbLastUpdatedAt: Date }
>();

/**
 * Loads APNs key data by keyRef from database, with in-memory caching.
 *
 * Workflow:
 * 1. Check in-memory cache
 * 2. If cache hit, verify DB last updated timestamp
 * 3. If stale or cache miss, query DB for keyRef to get encrypted data
 * 4. Decrypt the data
 * 5. Parse and return the APNs key data
 *
 * @param keyRef - The key reference identifier
 * @param env - The Worker environment (provides DB binding)
 * @param logger - Logger instance
 * @returns The loaded APNs key data or null if not found
 * @throws If decryption fails or other errors occur
 */
export async function loadApnsKeyData(
  keyRef: string,
  env: Env,
  logger: Logger
): Promise<ApnsKeyData | null> {
  const cacheKey = keyRef;

  const cachedEntry = apnsKeyCache.get(cacheKey);
  if (cachedEntry) {
    // Verify if cache is still fresh by checking DB timestamp
    const db = getDbClient(env, logger);
    const latestTimestamp = await db
      .select({ updatedAt: sharedSchema.walletApnsKey.updatedAt })
      .from(sharedSchema.walletApnsKey)
      .where(eq(sharedSchema.walletApnsKey.keyRef, keyRef))
      .limit(1)
      .then((r) => r[0]);

    // If DB has a newer timestamp or no timestamp found, invalidate cache
    const latestUpdatedAt = latestTimestamp?.updatedAt;
    if (!latestUpdatedAt || cachedEntry.dbLastUpdatedAt < latestUpdatedAt) {
      apnsKeyCache.delete(cacheKey);
    } else {
      return cachedEntry.data;
    }
  }

  try {
    const db = getDbClient(env, logger);
    const row = await db
      .select({
        keyRef: sharedSchema.walletApnsKey.keyRef,
        teamId: sharedSchema.walletApnsKey.teamId,
        keyId: sharedSchema.walletApnsKey.keyId,
        encryptedP8Key: sharedSchema.walletApnsKey.encryptedP8Key,
        updatedAt: sharedSchema.walletApnsKey.updatedAt,
      })
      .from(sharedSchema.walletApnsKey)
      .where(eq(sharedSchema.walletApnsKey.keyRef, keyRef))
      .limit(1)
      .then((r) => r[0]);

    if (!row) {
      return null; // Key metadata not found
    }

    if (!row.encryptedP8Key) {
      logger.error(
        'Encrypted key missing for keyRef',
        new Error('MissingEncryptedData'),
        { keyRef }
      );
      throw new Error(`Encrypted key missing for keyRef: ${keyRef}`);
    }

    // Decrypt using versioned format
    const decryptedData = await decryptWithVersion(row.encryptedP8Key, env);

    const decoder = new TextDecoder();
    const p8Pem = decoder.decode(decryptedData);

    const data: ApnsKeyData = {
      teamId: row.teamId,
      keyId: row.keyId,
      p8Pem,
    };

    // Cache the data with DB last updated timestamp
    // Use current time if updatedAt is null (shouldn't happen with properly configured schema)
    const dbLastUpdatedAt = row.updatedAt || new Date();
    apnsKeyCache.set(cacheKey, {
      data,
      dbLastUpdatedAt,
    });

    return data;
  } catch (error) {
    logger.error(
      'Failed to load APNs key data',
      error instanceof Error ? error : new Error(String(error)),
      { keyRef }
    );
    throw new Error(
      `Failed to load APNs key data: ${(error as Error).message}`
    );
  }
}

/**
 * Stores APNs key data in the database.
 *
 * Workflow:
 * 1. Encrypt the .p8 PEM string
 * 2. Store encrypted data (Base64) and IV (Base64) in the database
 * 3. Update the cache with the new key data
 *
 * @param keyRef - The key reference identifier
 * @param teamId - The Apple Developer Team ID
 * @param keyId - The APNs auth key ID (typically from the filename, e.g., AuthKey_KEYID.p8)
 * @param p8Pem - The raw PEM content of the .p8 file
 * @param env - The Worker environment (provides DB binding)
 * @param logger - Logger instance
 * @returns Promise that resolves when the operation is complete
 * @throws If encryption or storage fails
 */
export async function storeApnsKey(
  keyRef: string,
  teamId: string,
  keyId: string,
  p8Pem: string,
  env: Env,
  logger: Logger
): Promise<void> {
  try {
    // 1. Encode the .p8 PEM string to ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(p8Pem);

    // 2. Encrypt with versioned format
    const versionedCiphertext = await encryptWithVersion(dataBuffer, env);

    // 6. Store in the database
    const db = getDbClient(env, logger);

    // Use an upsert operation to insert or update
    await db
      .insert(sharedSchema.walletApnsKey)
      .values({
        keyRef,
        teamId,
        keyId,
        encryptedP8Key: versionedCiphertext,
      })
      .onConflictDoUpdate({
        target: sharedSchema.walletApnsKey.keyRef,
        set: {
          teamId,
          keyId,
          encryptedP8Key: versionedCiphertext,
          // updatedAt will be set automatically by the DB
        },
      });

    // 7. Get updated timestamp from DB
    const updatedRow = await db
      .select({ updatedAt: sharedSchema.walletApnsKey.updatedAt })
      .from(sharedSchema.walletApnsKey)
      .where(eq(sharedSchema.walletApnsKey.keyRef, keyRef))
      .limit(1)
      .then((r) => r[0]);

    // 8. Update in-memory cache
    const data: ApnsKeyData = {
      teamId,
      keyId,
      p8Pem,
    };

    // Cache with DB last updated timestamp, use current time if not available
    const dbLastUpdatedAt = updatedRow?.updatedAt || new Date();
    apnsKeyCache.set(keyRef, {
      data,
      dbLastUpdatedAt,
    });
  } catch (error) {
    logger.error(
      'Failed to store APNs key data',
      error instanceof Error ? error : new Error(String(error)),
      { keyRef, teamId, keyId }
    );
    throw new Error(
      `Failed to store APNs key data: ${(error as Error).message}`
    );
  }
}

/**
 * Invalidates a specific APNs key from the cache.
 * Useful when you know a key has been updated or revoked.
 *
 * @param keyRef - The key reference to invalidate in the cache
 * @param logger - Logger instance
 * @param triggeredByClientCacheInvalidation - Flag to prevent recursion if called from client cache invalidation
 */
export function invalidateApnsKeyCache(
  keyRef: string,
  logger: Logger,
  triggeredByClientCacheInvalidation = false
): void {
  const cachedEntry = apnsKeyCache.get(keyRef);
  apnsKeyCache.delete(keyRef);

  if (cachedEntry) {
    logger.info('Invalidated APNs key cache', { keyRef });
    if (!triggeredByClientCacheInvalidation) {
      // Invalidate related APNs client cache entries
      // Import here to avoid circular dependency
      const { invalidateApnsClientCache } = require('./apnsFetch');
      invalidateApnsClientCache(
        cachedEntry.data.teamId,
        cachedEntry.data.keyId,
        logger,
        true
      );
    }
  }
}
