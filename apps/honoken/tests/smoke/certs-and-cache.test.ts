import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMockEnv, createMockLogger } from "../fixtures/mock-env";

// Mock the db module before importing certs
vi.mock('../../src/db', () => ({
  getDbClient: vi.fn()
}));

describe("Certificate and Cache Management", () => {
  let mockEnv: any;
  let mockLogger: any;
  let mockDbClient: any;
  let originalCrypto: any;

  beforeEach(async () => {
    mockEnv = createMockEnv();
    mockLogger = createMockLogger();
    vi.clearAllMocks();
    
    // Create mock database client
    const { createMockDbClient } = await import('../fixtures/mock-env');
    mockDbClient = createMockDbClient();
    
    // Setup the getDbClient mock to return our mock DB
    const { getDbClient } = await import('../../src/db');
    (getDbClient as any).mockReturnValue(mockDbClient);
    
    // Save original crypto and mock it properly for Node.js environment
    originalCrypto = global.crypto;
    
    // Mock crypto.subtle for encryption/decryption operations
    Object.defineProperty(global, 'crypto', {
      value: {
        subtle: {
          importKey: vi.fn().mockResolvedValue({}),
          encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
          decrypt: vi.fn().mockResolvedValue(new TextEncoder().encode('{"test": "data"}')),
          generateKey: vi.fn().mockResolvedValue({}),
        },
        getRandomValues: vi.fn().mockImplementation((array: Uint8Array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
          }
          return array;
        }),
      },
      writable: true,
      configurable: true
    });
    
    // Clear the certificate cache before each test
    const { certCache } = await import("../../src/passkit/certs");
    certCache.clear();
  });

  afterEach(async () => {
    // Clear the certificate cache after each test
    const { certCache } = await import("../../src/passkit/certs");
    certCache.clear();
    
    // Restore original crypto
    if (originalCrypto) {
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    }
  });

  describe("Certificate Loading with Cache", () => {
    it("should cache certificates after first load", async () => {
      const { loadCertBundle } = await import("../../src/passkit/certs");
      
      mockDbClient.query.certs.findFirst.mockResolvedValueOnce({
        certRef: "test-cert",
        encryptedBundle: "v1:dGVzdC1pdi1kYXRh:ZW5jcnlwdGVkLWNlcnQtZGF0YQ==",
        updatedAt: new Date(),
        isEnhanced: true,
        teamId: "TEST_TEAM"
      });

      const result = await loadCertBundle("test-cert", mockEnv, mockLogger);
      
      expect(result).toBeDefined();
      expect(result.isEnhanced).toBe(true);
      expect(result.teamId).toBe("TEST_TEAM");
      expect(mockDbClient.query.certs.findFirst).toHaveBeenCalledTimes(1);
    });

    it("should invalidate stale cache entries", async () => {
      const { loadCertBundle, certCache } = await import("../../src/passkit/certs");
      
      const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      certCache.set("test-cert", {
        bundle: { 
          wwdr: "old", 
          signerCert: "old", 
          signerKey: "old", 
          signerKeyPassphrase: "",
          isEnhanced: true,
          teamId: "TEST_TEAM"
        },
        dbLastUpdatedAt: staleDate
      });

      mockDbClient.query.certs.findFirst
        .mockResolvedValueOnce({ updatedAt: new Date() }) 
        .mockResolvedValueOnce({
          certRef: "test-cert",
          encryptedBundle: "v1:dGVzdC1pdi1kYXRh:bmV3LWVuY3J5cHRlZC1kYXRh",
          updatedAt: new Date(),
          isEnhanced: true,
          teamId: "TEST_TEAM"
        });

      const result = await loadCertBundle("test-cert", mockEnv, mockLogger);
      
      expect(result).toBeDefined();
      expect(mockDbClient.query.certs.findFirst).toHaveBeenCalledTimes(2);
    });

    it("should handle missing certificate gracefully", async () => {
      const { loadCertBundle } = await import("../../src/passkit/certs");
      
      mockDbClient.query.certs.findFirst.mockResolvedValueOnce(null);

      await expect(loadCertBundle("nonexistent-cert", mockEnv, mockLogger))
        .rejects.toThrow("Certificate not found for certRef: nonexistent-cert");
    });

    it("should handle missing encrypted data", async () => {
      const { loadCertBundle } = await import("../../src/passkit/certs");
      
      mockDbClient.query.certs.findFirst.mockResolvedValueOnce({
        certRef: "test-cert",
        encryptedBundle: null,
        updatedAt: new Date(),
        isEnhanced: true,
        teamId: "TEST_TEAM"
      });

      await expect(loadCertBundle("test-cert", mockEnv, mockLogger))
        .rejects.toThrow("Encrypted bundle missing for certRef: test-cert");
    });

    it("should handle decryption failures", async () => {
      const { loadCertBundle } = await import("../../src/passkit/certs");
      
      mockDbClient.query.certs.findFirst.mockResolvedValueOnce({
        certRef: "test-cert",
        encryptedBundle: "v1:dGVzdC1pdi1kYXRh:Y29ycnVwdGVkLWRhdGE=",
        updatedAt: new Date(),
        isEnhanced: true,
        teamId: "TEST_TEAM"
      });

      (global.crypto.subtle.decrypt as any).mockRejectedValueOnce(new Error("Decryption failed"));

      await expect(loadCertBundle("test-cert", mockEnv, mockLogger))
        .rejects.toThrow("Failed to load certificate bundle: Decryption failed");
    });

    it("should handle invalid JSON in decrypted data", async () => {
      const { loadCertBundle } = await import("../../src/passkit/certs");
      
      mockDbClient.query.certs.findFirst.mockResolvedValueOnce({
        certRef: "test-cert",
        encryptedBundle: "v1:dGVzdC1pdi1kYXRh:ZW5jcnlwdGVkLWRhdGE=",
        updatedAt: new Date(),
        isEnhanced: true,
        teamId: "TEST_TEAM"
      });

      (global.crypto.subtle.decrypt as any).mockResolvedValueOnce(
        new TextEncoder().encode("invalid-json")
      );

      await expect(loadCertBundle("test-cert", mockEnv, mockLogger))
        .rejects.toThrow(/Unexpected token/);
    });
  });

  describe("Cache Invalidation", () => {
    it("should manually invalidate cache entries", async () => {
      const { invalidateCertCache, certCache } = await import("../../src/passkit/certs");
      
      certCache.set("test-cert", {
        bundle: { 
          wwdr: "test", 
          signerCert: "test", 
          signerKey: "test", 
          signerKeyPassphrase: "",
          isEnhanced: true,
          teamId: "TEST_TEAM"
        },
        dbLastUpdatedAt: new Date()
      });

      expect(certCache.has("test-cert")).toBe(true);
      
      invalidateCertCache("test-cert", mockLogger);
      
      expect(certCache.has("test-cert")).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Invalidated cache for certRef",
        { certRef: "test-cert" }
      );
    });

    it("should handle invalidation of non-existent cache entries gracefully", async () => {
      const { invalidateCertCache } = await import("../../src/passkit/certs");
      
      expect(() => invalidateCertCache("nonexistent-cert", mockLogger)).not.toThrow();
    });
  });

  describe("Certificate Storage", () => {
    it("should encrypt and store certificate bundle", async () => {
      const { storeCertBundle } = await import("../../src/passkit/certs");
      
      const testBundle = {
        wwdr: "test-wwdr",
        signerCert: "test-cert",
        signerKey: "test-key",
        signerKeyPassphrase: "test-passphrase"
      };

      mockDbClient.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined)
        })
      });

      mockDbClient.query.certs.findFirst.mockResolvedValueOnce({
        updatedAt: new Date()
      });
      
      await storeCertBundle("test-cert", testBundle, true, "desc", "TEAM1", mockEnv, mockLogger);
      
      expect(mockDbClient.insert().values).toHaveBeenCalled();
      const insertCall = (mockDbClient.insert() as any).values.mock.calls[0][0];
      expect(insertCall.encryptedBundle).toMatch(/^v\d+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
    });
  });

  describe("Cache Behavior Edge Cases", () => {
    it("should handle cache entries with null timestamps by re-fetching", async () => {
      const { loadCertBundle, certCache } = await import("../../src/passkit/certs");

      certCache.set("test-cert", {
        bundle: {
          wwdr: "test",
          signerCert: "test",
          signerKey: "test",
          signerKeyPassphrase: "",
          isEnhanced: true,
          teamId: "TEST_TEAM"
        },
        dbLastUpdatedAt: null
      });

      mockDbClient.query.certs.findFirst
      .mockResolvedValueOnce(null) // First call for timestamp check returns null, forcing re-fetch
      .mockResolvedValueOnce({
          certRef: "test-cert",
          encryptedBundle: "v1:dGVzdC1pdi1kYXRh:bmV3LWVuY3J5cHRlZC1kYXRh",
          updatedAt: new Date(),
          isEnhanced: true,
          teamId: "TEST_TEAM"
        });
      
      const result = await loadCertBundle("test-cert", mockEnv, mockLogger);
      expect(result).toBeDefined();
      expect(mockDbClient.query.certs.findFirst).toHaveBeenCalledTimes(2);
    });

    it("should handle multiple concurrent loads of same cert", async () => {
      const { loadCertBundle } = await import("../../src/passkit/certs");

      mockDbClient.query.certs.findFirst.mockResolvedValue({
        certRef: "test-cert",
        encryptedBundle: "v1:dGVzdC1pdi1kYXRh:ZW5jcnlwdGVkLWNlcnQtZGF0YQ==",
        updatedAt: new Date(),
        isEnhanced: true,
        teamId: "TEST_TEAM"
      });

      const promises = [
        loadCertBundle("test-cert", mockEnv, mockLogger),
        loadCertBundle("test-cert", mockEnv, mockLogger),
      ];
      
      const results = await Promise.all(promises);
      
      expect(results[0]).toEqual(results[1]);
      expect(mockDbClient.query.certs.findFirst).toHaveBeenCalledTimes(1);
    });

    it("should handle different certs in cache simultaneously", async () => {
      const { loadCertBundle } = await import("../../src/passkit/certs");
      
      mockDbClient.query.certs.findFirst
        .mockResolvedValueOnce({
          certRef: "test-cert-1",
          encryptedBundle: "v1:dGVzdC1pdi1kYXRh:ZGF0YS0x",
          updatedAt: new Date(),
          isEnhanced: true,
          teamId: "TEST_TEAM_1",
        })
        .mockResolvedValueOnce({
          certRef: "test-cert-2",
          encryptedBundle: "v1:dGVzdC1pdi1kYXRh:ZGF0YS0y",
          updatedAt: new Date(),
          isEnhanced: false,
          teamId: "TEST_TEAM_2",
        });

      const [result1, result2] = await Promise.all([
        loadCertBundle("test-cert-1", mockEnv, mockLogger),
        loadCertBundle("test-cert-2", mockEnv, mockLogger),
      ]);
      
      expect(result1.teamId).toBe("TEST_TEAM_1");
      expect(result2.teamId).toBe("TEST_TEAM_2");
      expect(mockDbClient.query.certs.findFirst).toHaveBeenCalledTimes(2);
    });
  });
}); 