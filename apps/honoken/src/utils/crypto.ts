import type { Env } from '../types';
import type { webcrypto } from 'node:crypto';

/**
 * Helper to convert ArrayBuffer or Uint8Array to Base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Buffer.from(bytes).toString('base64');
}

/**
 * Helper to convert Base64 to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const buffer = Buffer.from(base64, 'base64');
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

// Cache for versioned encryption keys
const cachedKeys = new Map<string, webcrypto.CryptoKey>();

/**
 * Gets the current encryption key version from environment.
 * @param env - The Worker environment
 * @returns The current key version (e.g., 'v1')
 */
export function getCurrentKeyVersion(env: Env): string {
  const version = env.HONOKEN_ENCRYPTION_KEY_CURRENT;
  if (!version) {
    throw new Error('HONOKEN_ENCRYPTION_KEY_CURRENT is not set. Please specify the current key version.');
  }
  return version;
}

/**
 * Retrieves a versioned encryption key from environment variables.
 * Implements in-memory caching for imported keys.
 *
 * @param env - The Worker environment
 * @param version - The key version to retrieve (e.g., 'v1')
 * @returns The validated CryptoKey for AES-GCM encryption/decryption
 * @throws If the requested key version is not found or has invalid length
 */
export async function getVersionedEncryptionKey(env: Env, version: string): Promise<webcrypto.CryptoKey> {
  // Check cache first
  if (cachedKeys.has(version)) {
    return cachedKeys.get(version)!;
  }

  // Get the versioned key from environment
  const envVarName = `HONOKEN_ENCRYPTION_KEY_${version.toUpperCase()}`;
  const base64Key = (env as any)[envVarName];
  
  if (!base64Key) {
    throw new Error(`Encryption key ${envVarName} is not set.`);
  }

  const keyBytes = base64ToArrayBuffer(base64Key);

  const validLengths = [16, 24, 32]; // 128, 192, 256 bits
  if (!validLengths.includes(keyBytes.byteLength)) {
    throw new Error(
      `Invalid ${envVarName} length: ${keyBytes.byteLength} bytes. Must be 16, 24, or 32 bytes.`
    );
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false, // non-extractable for security - prevents key extraction
    ['encrypt', 'decrypt']
  );

  cachedKeys.set(version, cryptoKey);
  return cryptoKey;
}

/**
 * Encrypts data with the current key version and returns versioned ciphertext.
 * Format: "version:iv:encryptedData" (all parts base64 encoded)
 * 
 * @param data - The data to encrypt
 * @param env - The Worker environment
 * @returns Base64-encoded versioned ciphertext
 */
export async function encryptWithVersion(data: ArrayBuffer | Uint8Array, env: Env): Promise<string> {
  const version = getCurrentKeyVersion(env);
  const cryptoKey = await getVersionedEncryptionKey(env, version);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  // Format: version:iv:encryptedData
  const ivBase64 = arrayBufferToBase64(iv);
  const encryptedBase64 = arrayBufferToBase64(encryptedData);
  
  return `${version}:${ivBase64}:${encryptedBase64}`;
}

/**
 * Decrypts versioned ciphertext using the appropriate key version.
 * Expects format: "version:iv:encryptedData"
 * 
 * @param versionedCiphertext - The versioned ciphertext to decrypt
 * @param env - The Worker environment
 * @returns The decrypted data as ArrayBuffer
 */
export async function decryptWithVersion(versionedCiphertext: string, env: Env): Promise<ArrayBuffer> {
  // Parse the versioned format
  const parts = versionedCiphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid versioned ciphertext format. Expected "version:iv:encryptedData"');
  }
  
  const [version, ivBase64, encryptedBase64] = parts;
  
  // Get the appropriate key for this version
  const cryptoKey = await getVersionedEncryptionKey(env, version);
  
  // Decode components
  const iv = base64ToArrayBuffer(ivBase64);
  const encryptedData = base64ToArrayBuffer(encryptedBase64);
  
  // Decrypt
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encryptedData
  );
  
  return decryptedData;
}

/**
 * Legacy function for backward compatibility during migration.
 * @deprecated Use getVersionedEncryptionKey instead
 */
export async function getValidatedEncryptionKey(env: Env): Promise<webcrypto.CryptoKey> {
  // For backward compatibility, try to use v1 if old env var exists
  if (env.HONOKEN_PEM_BUNDLE_ENCRYPTION_KEY && !env.HONOKEN_ENCRYPTION_KEY_V1) {
    throw new Error(
      'Legacy HONOKEN_PEM_BUNDLE_ENCRYPTION_KEY detected. ' +
      'Please migrate to HONOKEN_ENCRYPTION_KEY_V1 and set HONOKEN_ENCRYPTION_KEY_CURRENT=v1'
    );
  }
  
  const version = getCurrentKeyVersion(env);
  return getVersionedEncryptionKey(env, version);
}
/**
 * Computes the SHA-256 hash of a string.
 * @param input The string to hash.
 * @returns A promise that resolves to the hex-encoded SHA-256 hash.
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}

/**
 * Truncates a string in the middle if it exceeds a maximum length.
 * @param text The string to truncate.
 * @param maxLength The maximum allowed length.
 * @returns The original string or the truncated string.
 */
export function truncateMiddle(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  const half = Math.floor(maxLength / 2) - 2; // -2 for "..."
  return `${text.substring(0, half)}...${text.substring(text.length - half)}`;
}