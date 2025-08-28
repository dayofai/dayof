import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getVersionedEncryptionKey, 
  encryptWithVersion, 
  decryptWithVersion,
  arrayBufferToBase64,
  base64ToArrayBuffer
} from '../../src/utils/crypto';
import type { Env } from '../../src/types';

describe('Encryption Key Versioning', () => {
  let mockEnv: Env;

  beforeEach(() => {
    // Create a fresh mock environment for each test
    mockEnv = {
      HONOKEN_ENCRYPTION_KEY_V1: arrayBufferToBase64(new Uint8Array(32).fill(1)), // 32 bytes for AES-256
      HONOKEN_ENCRYPTION_KEY_V2: arrayBufferToBase64(new Uint8Array(32).fill(2)), // 32 bytes for AES-256
      HONOKEN_ENCRYPTION_KEY_CURRENT: 'v1'
    } as Env;
  });

  describe('getVersionedEncryptionKey', () => {
    it('should return a valid CryptoKey for version v1', async () => {
      const key = await getVersionedEncryptionKey(mockEnv, 'v1');
      expect(key).toBeInstanceOf(CryptoKey);
      expect(key.algorithm.name).toBe('AES-GCM');
      expect(key.usages).toContain('encrypt');
      expect(key.usages).toContain('decrypt');
    });

    it('should return a valid CryptoKey for version v2', async () => {
      const key = await getVersionedEncryptionKey(mockEnv, 'v2');
      expect(key).toBeInstanceOf(CryptoKey);
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    it('should throw error for non-existent version', async () => {
      await expect(getVersionedEncryptionKey(mockEnv, 'v3')).rejects.toThrow('Encryption key HONOKEN_ENCRYPTION_KEY_V3 is not set');
    });

    it('should cache keys after first retrieval', async () => {
      const key1 = await getVersionedEncryptionKey(mockEnv, 'v1');
      const key2 = await getVersionedEncryptionKey(mockEnv, 'v1');
      expect(key1).toBe(key2); // Same instance
    });
  });

  describe('encryptWithVersion and decryptWithVersion', () => {
    it('should encrypt and decrypt string data with current version', async () => {
      const testData = 'sensitive data to encrypt';
      const dataBuffer = new TextEncoder().encode(testData);
      
      const encrypted = await encryptWithVersion(dataBuffer, mockEnv);
      
      // Verify the format includes version prefix
      expect(encrypted).toMatch(/^v1:/);
      
      const decrypted = await decryptWithVersion(encrypted, mockEnv);
      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(testData);
    });

    it('should encrypt with v2 when current version is changed', async () => {
      const testData = 'test data';
      const dataBuffer = new TextEncoder().encode(testData);
      
      // Change current version to v2
      mockEnv.HONOKEN_ENCRYPTION_KEY_CURRENT = 'v2';
      
      const encrypted = await encryptWithVersion(dataBuffer, mockEnv);
      expect(encrypted).toMatch(/^v2:/);
    });

    it('should decrypt data encrypted with v1 even when current is v2', async () => {
      const testData = 'cross-version test';
      const dataBuffer = new TextEncoder().encode(testData);
      
      // First encrypt with v1
      const encryptedV1 = await encryptWithVersion(dataBuffer, mockEnv);
      expect(encryptedV1).toMatch(/^v1:/);
      
      // Switch to v2
      mockEnv.HONOKEN_ENCRYPTION_KEY_CURRENT = 'v2';
      
      // Should still decrypt v1 data
      const decrypted = await decryptWithVersion(encryptedV1, mockEnv);
      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(testData);
    });

    it('should handle ciphertext format correctly', async () => {
      const dataBuffer = new TextEncoder().encode('test');
      const encrypted = await encryptWithVersion(dataBuffer, mockEnv);
      const parts = encrypted.split(':');
      
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('v1'); // version
      expect(parts[1].length).toBeGreaterThan(0); // base64 IV (12 bytes for GCM)
      expect(parts[2].length).toBeGreaterThan(0); // encrypted data
    });

    it('should throw error for malformed ciphertext', async () => {
      await expect(decryptWithVersion('invalid-format', mockEnv)).rejects.toThrow('Invalid versioned ciphertext format');
      await expect(decryptWithVersion('v1:tooshort', mockEnv)).rejects.toThrow('Invalid versioned ciphertext format');
    });

    it('should throw error for unknown version in ciphertext', async () => {
      await expect(decryptWithVersion('v99:someiv:somedata', mockEnv)).rejects.toThrow('Encryption key HONOKEN_ENCRYPTION_KEY_V99 is not set');
    });

    it('should handle empty data', async () => {
      const emptyBuffer = new Uint8Array(0);
      const encrypted = await encryptWithVersion(emptyBuffer, mockEnv);
      const decrypted = await decryptWithVersion(encrypted, mockEnv);
      expect(decrypted.byteLength).toBe(0);
    });

    it('should produce different ciphertexts for same data (due to random IV)', async () => {
      const dataBuffer = new TextEncoder().encode('test');
      const encrypted1 = await encryptWithVersion(dataBuffer, mockEnv);
      const encrypted2 = await encryptWithVersion(dataBuffer, mockEnv);
      
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same value
      const decrypted1 = await decryptWithVersion(encrypted1, mockEnv);
      const decrypted2 = await decryptWithVersion(encrypted2, mockEnv);
      
      const text1 = new TextDecoder().decode(decrypted1);
      const text2 = new TextDecoder().decode(decrypted2);
      expect(text1).toBe(text2);
    });
  });

  describe('Key rotation scenario', () => {
    it('should support reading old and new data during rotation', async () => {
      // Simulate a key rotation scenario
      const oldData = 'data encrypted with v1';
      const newData = 'data encrypted with v2';
      
      // Encrypt with v1
      const oldBuffer = new TextEncoder().encode(oldData);
      const encryptedOld = await encryptWithVersion(oldBuffer, mockEnv);
      
      // Switch to v2
      mockEnv.HONOKEN_ENCRYPTION_KEY_CURRENT = 'v2';
      
      // Encrypt new data with v2
      const newBuffer = new TextEncoder().encode(newData);
      const encryptedNew = await encryptWithVersion(newBuffer, mockEnv);
      
      // Should be able to decrypt both
      const decryptedOld = await decryptWithVersion(encryptedOld, mockEnv);
      const decryptedNew = await decryptWithVersion(encryptedNew, mockEnv);
      
      const oldText = new TextDecoder().decode(decryptedOld);
      const newText = new TextDecoder().decode(decryptedNew);
      
      expect(oldText).toBe(oldData);
      expect(newText).toBe(newData);
      expect(encryptedOld).toMatch(/^v1:/);
      expect(encryptedNew).toMatch(/^v2:/);
    });
  });
});