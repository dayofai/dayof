import type { Env } from "../types";
import { getDbClient } from "../db/index";
import { eq } from "drizzle-orm";
import { certs } from "../db/schema";
import {
	encryptWithVersion,
	decryptWithVersion,
} from "../utils/crypto";
import { createBoundedMap } from "../utils/bounded-cache";
import type { Logger } from '../utils/logger';

/**
 * Represents a loaded certificate bundle for pass signing.
 */
export type CertBundle = {
	wwdr: string;
	signerCert: string;
	signerKey: string;
	signerKeyPassphrase: string;
	isEnhanced: boolean;
	teamId: string;
};

// Certificate cache with size limit (max 100 entries, no TTL needed - we do DB timestamp validation)
export const certCache = createBoundedMap<string, { bundle: CertBundle; dbLastUpdatedAt: Date | null }>();
const inFlightRequests = new Map<string, Promise<CertBundle>>();

/**
 * Loads a certificate bundle by certRef from the database, with in-memory caching.
 *
 * Workflow:
 * 1. Check in-memory cache
 * 2. If cache hit, verify DB last updated timestamp
 * 3. If stale or cache miss, query DB for certRef to get encrypted data
 * 4. Decrypt the data
 * 5. Parse and return the certificate bundle
 *
 * @param certRef - The certificate reference key
 * @param env - The Worker environment (provides DB binding)
 * @param logger - Logger instance
 * @returns The loaded CertBundle
 * @throws If the certRef is not found or decryption fails
 */
export async function loadCertBundle(certRef: string, env: Env, logger: Logger): Promise<CertBundle> {
	const cacheKey = certRef;
	
	if (certCache.has(cacheKey)) {
		const cachedEntry = certCache.get(cacheKey)!;
		
		// Verify if cache is still fresh by checking DB timestamp
		const db = getDbClient(env, logger);
		const latestTimestamp = await db.query.certs.findFirst({
			where: (c, { eq }) => eq(c.certRef, certRef),
			columns: { updatedAt: true }
		});

		// If DB has a newer timestamp or no timestamp found, invalidate cache
		if (
			!latestTimestamp?.updatedAt ||
			!cachedEntry.dbLastUpdatedAt ||
			cachedEntry.dbLastUpdatedAt < latestTimestamp.updatedAt
		) {
			certCache.delete(cacheKey);
		} else {
			return cachedEntry.bundle;
		}
	}

	// 3. Check for in-flight requests to prevent dog-piling
	if (inFlightRequests.has(cacheKey)) {
		return inFlightRequests.get(cacheKey)!;
	}

	// 4. Load from DB
	const loadPromise = (async () => {
		try {
			const db = getDbClient(env, logger);
			const row = await db.query.certs.findFirst({
				where: (c, { eq }) => eq(c.certRef, certRef),
			});

			if (!row) {
				logger.error('Certificate not found for certRef', new Error('CertNotFound'), { certRef });
				throw new Error(`Certificate not found for certRef: ${certRef}`);
			}

			if (!row.encryptedBundle) {
				logger.error('Encrypted bundle missing for certRef', new Error('MissingEncryptedData'), { certRef });
				throw new Error(`Encrypted bundle missing for certRef: ${certRef}`);
			}

			// Decrypt using versioned format
			const decryptedData = await decryptWithVersion(row.encryptedBundle, env);

			const decoder = new TextDecoder();
			const pemBundleJson = decoder.decode(decryptedData);
			const pemBundle = JSON.parse(pemBundleJson);

			const bundle: CertBundle = {
				wwdr: pemBundle.wwdr,
				signerCert: pemBundle.signerCert,
				signerKey: pemBundle.signerKey,
				signerKeyPassphrase: pemBundle.signerKeyPassphrase,
				isEnhanced: row.isEnhanced,
				teamId: row.teamId,
			};

			// Cache the bundle with DB last updated timestamp
			// Use current time if updated_at is null (shouldn't happen with properly configured schema)
			const dbLastUpdatedAt = row.updatedAt ?? null;
			certCache.set(cacheKey, { 
				bundle, 
				dbLastUpdatedAt
			});
			
			return bundle;
		} catch (error) {
			logger.error('Failed to load certificate bundle', error instanceof Error ? error : new Error(String(error)), { certRef });
			throw new Error(`Failed to load certificate bundle: ${(error as Error).message}`);
		} finally {
			// 5. Clean up in-flight request
			inFlightRequests.delete(cacheKey);
		}
	})();

	inFlightRequests.set(cacheKey, loadPromise);

	return loadPromise;
}

/**
 * Stores a certificate bundle in the database.
 *
 * Workflow:
 * 1. Encrypt the bundle data
 * 2. Store encrypted data (Base64) and IV (Base64) in the database
 * 3. Update the cache with the new bundle
 *
 * @param certRef - The certificate reference key
 * @param bundleData - The PEM bundle data to encrypt and store
 * @param isEnhanced - Whether this is an enhanced certificate
 * @param description - Optional description of the certificate
 * @param teamId - The Apple Developer Team ID
 * @param env - The Worker environment (provides DB binding)
 * @param logger - Logger instance
 * @returns Promise that resolves when the operation is complete
 * @throws If encryption or storage fails
 */
export async function storeCertBundle(
	certRef: string,
	bundleData: {
		wwdr: string;
		signerCert: string;
		signerKey: string;
		signerKeyPassphrase: string;
	},
	isEnhanced: boolean,
	description: string | null,
	teamId: string,
	env: Env,
	logger: Logger
): Promise<void> {
	try {
		// 1. Convert bundle data to JSON string and encode to ArrayBuffer
		const encoder = new TextEncoder();
		const dataBuffer = encoder.encode(JSON.stringify(bundleData));

		// 2. Encrypt with versioned format
		const versionedCiphertext = await encryptWithVersion(dataBuffer, env);

		// 6. Store in the database
		const db = getDbClient(env, logger);

		await db.insert(certs)
					.values({
			certRef,
			description,
			isEnhanced,
			teamId,
			encryptedBundle: versionedCiphertext,
			iv: '', // Empty string - IV is now embedded in versioned ciphertext
		})
			.onConflictDoUpdate({
				target: certs.certRef,
				set: {
					description,
					isEnhanced,
					teamId,
					encryptedBundle: versionedCiphertext,
					iv: '', // Empty string - IV is now embedded in versioned ciphertext
					// updatedAt will be set automatically by the DB
				},
			});

		// 7. Get updated timestamp from DB
		const updatedRow = await db.query.certs.findFirst({
			where: (c, { eq }) => eq(c.certRef, certRef),
			columns: { updatedAt: true }
		});

		// 8. Update in-memory cache
		const bundle: CertBundle = {
			...bundleData,
			isEnhanced,
			teamId: teamId,
		};
		
		// Cache with DB last updated timestamp, use current time if not available
		const dbLastUpdatedAt = updatedRow?.updatedAt ?? null;
		certCache.set(certRef, { 
			bundle, 
			dbLastUpdatedAt
		});
	} catch (error) {
		logger.error('Failed to store certificate bundle', error instanceof Error ? error : new Error(String(error)), { certRef, teamId });
		throw new Error(`Failed to store certificate bundle: ${(error as Error).message}`);
	}
}

/**
 * Invalidates a specific certificate from the cache.
 * Useful when you know a certificate has been updated or revoked.
 *
 * @param certRef - The certificate reference key to invalidate in the cache
 * @param logger - Logger instance
 */
export function invalidateCertCache(certRef: string, logger: Logger): void {
	certCache.delete(certRef);
	logger.info('Invalidated cache for certRef', { certRef });
}