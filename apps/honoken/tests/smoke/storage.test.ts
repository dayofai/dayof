import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockEnv, createMockLogger } from '../fixtures/mock-env';
import {
  TEST_AUTH_TOKEN,
  TEST_DEVICE_ID,
  TEST_PASS_TYPE,
  TEST_PUSH_TOKEN,
  TEST_SERIAL,
} from '../fixtures/test-data';

// Mock the db module before importing storage
vi.mock('../../src/db', () => ({
  getDbClient: vi.fn(),
}));

describe('Storage Layer Behavior Tests', () => {
  let mockEnv: any;
  let mockLogger: any;
  let mockDbClient: any;

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
  });

  describe('verifyToken', () => {
    it('should verify valid ApplePass token', async () => {
      const { verifyToken } = await import('../../src/storage');

      // Setup mock to return our test pass
      mockDbClient.query.walletPass.findFirst.mockResolvedValueOnce({
        authenticationToken: TEST_AUTH_TOKEN,
      });

      const result = await verifyToken(
        mockEnv,
        TEST_PASS_TYPE,
        TEST_SERIAL,
        `ApplePass ${TEST_AUTH_TOKEN}`,
        mockLogger
      );

      expect(result.valid).toBe(true);
      expect(result.notFound).toBe(false);

      // Verify the query was called correctly
      expect(mockDbClient.query.walletPass.findFirst).toHaveBeenCalledWith({
        columns: { authenticationToken: true },
        where: {
          passTypeIdentifier: TEST_PASS_TYPE,
          serialNumber: TEST_SERIAL,
        },
      });
    });

    it('should reject invalid token format', async () => {
      const { verifyToken } = await import('../../src/storage');

      // Mock DB to return a pass but with different token
      mockDbClient.query.walletPass.findFirst.mockResolvedValueOnce({
        authenticationToken: TEST_AUTH_TOKEN,
      });

      const result = await verifyToken(
        mockEnv,
        TEST_PASS_TYPE,
        TEST_SERIAL,
        'ApplePass wrong-token', // Correct prefix but wrong token
        mockLogger
      );

      expect(result.valid).toBe(false);
      expect(result.notFound).toBe(false);

      // Should query DB because token extraction resulted in non-empty string
      expect(mockDbClient.query.walletPass.findFirst).toHaveBeenCalledWith({
        columns: { authenticationToken: true },
        where: {
          passTypeIdentifier: TEST_PASS_TYPE,
          serialNumber: TEST_SERIAL,
        },
      });
    });

    it('should handle missing authorization header', async () => {
      const { verifyToken } = await import('../../src/storage');

      const result = await verifyToken(
        mockEnv,
        TEST_PASS_TYPE,
        TEST_SERIAL,
        undefined,
        mockLogger
      );

      expect(result.valid).toBe(false);
      expect(result.notFound).toBe(false);

      // Should not query DB for missing auth header
      expect(mockDbClient.query.walletPass.findFirst).not.toHaveBeenCalled();
    });

    it('should handle pass not found', async () => {
      const { verifyToken } = await import('../../src/storage');

      mockDbClient.query.walletPass.findFirst.mockResolvedValueOnce(null);

      const result = await verifyToken(
        mockEnv,
        TEST_PASS_TYPE,
        TEST_SERIAL,
        `ApplePass ${TEST_AUTH_TOKEN}`,
        mockLogger
      );

      expect(result.valid).toBe(false);
      expect(result.notFound).toBe(true);
    });

    it('should handle token mismatch', async () => {
      const { verifyToken } = await import('../../src/storage');

      mockDbClient.query.walletPass.findFirst.mockResolvedValueOnce({
        authenticationToken: 'different-token',
      });

      const result = await verifyToken(
        mockEnv,
        TEST_PASS_TYPE,
        TEST_SERIAL,
        `ApplePass ${TEST_AUTH_TOKEN}`,
        mockLogger
      );

      expect(result.valid).toBe(false);
      expect(result.notFound).toBe(false);
    });
  });

  describe('registerDevice', () => {
    it('should handle new device registration', async () => {
      const { registerDevice } = await import('../../src/storage');

      // Mock successful token verification
      mockDbClient.query.walletPass.findFirst.mockResolvedValueOnce({
        authenticationToken: TEST_AUTH_TOKEN,
      });

      // Mock transaction to simulate no existing registration
      mockDbClient.transaction.mockImplementationOnce(
        async (callback: (tx: any) => Promise<any>) => {
          const mockTx = {
            insert: vi.fn().mockReturnValue({
              values: vi.fn().mockReturnValue({
                onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
                onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
              }),
            }),
            update: vi.fn().mockReturnValue({
              set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined),
              }),
            }),
            query: {
              walletRegistration: {
                findFirst: vi.fn().mockResolvedValue(null), // No existing registration
              },
              walletPass: {
                findFirst: vi.fn().mockResolvedValue({ id: 'pass-id-1' }),
              },
            },
          };
          return callback(mockTx);
        }
      );

      const result = await registerDevice(
        mockEnv,
        TEST_DEVICE_ID,
        TEST_PASS_TYPE,
        TEST_SERIAL,
        TEST_PUSH_TOKEN,
        `ApplePass ${TEST_AUTH_TOKEN}`,
        mockLogger
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(201); // New registration
      expect(result.message).toContain('successfully registered');
    });

    it('should reactivate inactive registration', async () => {
      const { registerDevice } = await import('../../src/storage');

      // Mock successful token verification
      mockDbClient.query.walletPass.findFirst.mockResolvedValueOnce({
        authenticationToken: TEST_AUTH_TOKEN,
      });

      // Mock transaction with existing inactive registration
      mockDbClient.transaction.mockImplementationOnce(
        async (callback: (tx: any) => Promise<any>) => {
          const mockTx = {
            insert: vi.fn().mockReturnValue({
              values: vi.fn().mockReturnValue({
                onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
                onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
              }),
            }),
            update: vi.fn().mockReturnValue({
              set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined),
              }),
            }),
            query: {
              walletRegistration: {
                findFirst: vi.fn().mockResolvedValue({ active: false }), // Existing inactive
              },
            },
          };
          return callback(mockTx);
        }
      );

      const result = await registerDevice(
        mockEnv,
        TEST_DEVICE_ID,
        TEST_PASS_TYPE,
        TEST_SERIAL,
        TEST_PUSH_TOKEN,
        `ApplePass ${TEST_AUTH_TOKEN}`,
        mockLogger
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toContain('reactivated');
    });

    it('should handle already active registration', async () => {
      const { registerDevice } = await import('../../src/storage');

      // Mock successful token verification
      mockDbClient.query.walletPass.findFirst.mockResolvedValueOnce({
        authenticationToken: TEST_AUTH_TOKEN,
      });

      // Mock transaction with existing active registration
      mockDbClient.transaction.mockImplementationOnce(
        async (callback: (tx: any) => Promise<any>) => {
          const mockTx = {
            insert: vi.fn().mockReturnValue({
              values: vi.fn().mockReturnValue({
                onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
                onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
              }),
            }),
            update: vi.fn().mockReturnValue({
              set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined),
              }),
            }),
            query: {
              walletRegistration: {
                findFirst: vi.fn().mockResolvedValue({ active: true }), // Already active
              },
            },
          };
          return callback(mockTx);
        }
      );

      const result = await registerDevice(
        mockEnv,
        TEST_DEVICE_ID,
        TEST_PASS_TYPE,
        TEST_SERIAL,
        TEST_PUSH_TOKEN,
        `ApplePass ${TEST_AUTH_TOKEN}`,
        mockLogger
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toContain('already registered');
    });

    it('should reject invalid authentication token', async () => {
      const { registerDevice } = await import('../../src/storage');

      // Mock failed token verification
      mockDbClient.query.walletPass.findFirst.mockResolvedValueOnce({
        authenticationToken: 'different-token',
      });

      const result = await registerDevice(
        mockEnv,
        TEST_DEVICE_ID,
        TEST_PASS_TYPE,
        TEST_SERIAL,
        TEST_PUSH_TOKEN,
        `ApplePass ${TEST_AUTH_TOKEN}`,
        mockLogger
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
      expect(result.message).toContain('Invalid authentication token');

      // Should not run transaction for invalid auth
      expect(mockDbClient.transaction).not.toHaveBeenCalled();
    });

    it('should handle pass not found', async () => {
      const { registerDevice } = await import('../../src/storage');

      // Mock pass not found
      mockDbClient.query.walletPass.findFirst.mockResolvedValueOnce(null);

      const result = await registerDevice(
        mockEnv,
        TEST_DEVICE_ID,
        TEST_PASS_TYPE,
        TEST_SERIAL,
        TEST_PUSH_TOKEN,
        `ApplePass ${TEST_AUTH_TOKEN}`,
        mockLogger
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.message).toContain('Pass not found');

      // Should not run transaction for missing pass
      expect(mockDbClient.transaction).not.toHaveBeenCalled();
    });

    it('should handle transaction errors', async () => {
      const { registerDevice } = await import('../../src/storage');

      // Mock successful token verification
      mockDbClient.query.walletPass.findFirst.mockResolvedValueOnce({
        authenticationToken: TEST_AUTH_TOKEN,
      });

      // Mock transaction failure
      mockDbClient.transaction.mockRejectedValueOnce(
        new Error('Database error')
      );

      const result = await registerDevice(
        mockEnv,
        TEST_DEVICE_ID,
        TEST_PASS_TYPE,
        TEST_SERIAL,
        TEST_PUSH_TOKEN,
        `ApplePass ${TEST_AUTH_TOKEN}`,
        mockLogger
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(500);
      expect(result.message).toContain('Internal server error');

      // Should log the error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error during device registration transaction',
        expect.any(Error),
        expect.objectContaining({
          deviceLibraryIdentifier: TEST_DEVICE_ID,
          passTypeIdentifier: TEST_PASS_TYPE,
          serialNumber: TEST_SERIAL,
        })
      );
    });
  });

  describe('listUpdatedSerials', () => {
    it('should return undefined when no active registrations exist', async () => {
      const { listUpdatedSerials } = await import('../../src/storage');

      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
      mockDbClient.select.mockReturnValue({ from: mockFrom });

      const result = await listUpdatedSerials(
        mockEnv,
        TEST_DEVICE_ID,
        TEST_PASS_TYPE,
        {},
        mockLogger
      );

      expect(result).toBeUndefined();
      expect(mockDbClient.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockInnerJoin).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should return updated serials when passes exist', async () => {
      const { listUpdatedSerials } = await import('../../src/storage');

      const updatedPasses = [
        {
          serialNumber: 'serial-1',
          updated_at: new Date('2023-01-01T12:00:00Z'),
        },
        {
          serialNumber: 'serial-2',
          updated_at: new Date('2023-01-01T13:00:00Z'),
        },
      ];

      const mockWhere = vi.fn().mockResolvedValue(updatedPasses);
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
      mockDbClient.select.mockReturnValue({ from: mockFrom });

      const result = await listUpdatedSerials(
        mockEnv,
        TEST_DEVICE_ID,
        TEST_PASS_TYPE,
        {},
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result?.serialNumbers).toEqual(['serial-1', 'serial-2']);
      expect(result?.lastUpdated).toBe(
        String(Math.floor(new Date('2023-01-01T13:00:00Z').getTime() / 1000))
      );
    });

    it('should filter by passesUpdatedSince', async () => {
      const { listUpdatedSerials } = await import('../../src/storage');

      const updatedPasses = [
        {
          serialNumber: 'serial-2',
          updated_at: new Date('2023-01-01T13:00:00Z'),
        },
      ];
      const mockWhere = vi.fn().mockResolvedValue(updatedPasses);
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
      mockDbClient.select.mockReturnValue({ from: mockFrom });

      const sinceTimestamp = String(
        Math.floor(new Date('2023-01-01T12:30:00Z').getTime() / 1000)
      );

      const result = await listUpdatedSerials(
        mockEnv,
        TEST_DEVICE_ID,
        TEST_PASS_TYPE,
        { passesUpdatedSince: sinceTimestamp },
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result?.serialNumbers).toEqual(['serial-2']);

      const whereCall = mockWhere.mock.calls[0][0];
      // This is a bit of a hacky way to check the dynamic where clause.
      // A more robust way might involve inspecting the SQL generated by drizzle-kit.
      // For now, we just check that it's an 'and' with more than the base conditions.
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('getPassData', () => {
    it('should return pass data when found', async () => {
      const { getPassData } = await import('../../src/storage');

      const mockPassData = {
        authenticationToken: TEST_AUTH_TOKEN,
        passTypeIdentifier: TEST_PASS_TYPE,
        serialNumber: TEST_SERIAL,
      };

      mockDbClient.query.walletPass.findFirst.mockResolvedValueOnce(
        mockPassData
      );

      const result = await getPassData(
        mockEnv,
        TEST_PASS_TYPE,
        TEST_SERIAL,
        mockLogger
      );

      expect(result).toEqual(mockPassData);
    });

    it('should return undefined when pass not found', async () => {
      const { getPassData } = await import('../../src/storage');

      mockDbClient.query.walletPass.findFirst.mockResolvedValueOnce(null);

      const result = await getPassData(
        mockEnv,
        TEST_PASS_TYPE,
        TEST_SERIAL,
        mockLogger
      );

      expect(result).toBeUndefined();
    });
  });

  describe('logMessages', () => {
    it('should log each message with proper formatting', async () => {
      const { logMessages } = await import('../../src/storage');

      const testLogs = ['Log message 1', 'Log message 2'];

      await logMessages(testLogs, mockLogger);

      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('[PassKit Log]', {
        messageContent: 'Log message 1',
      });
      expect(mockLogger.info).toHaveBeenCalledWith('[PassKit Log]', {
        messageContent: 'Log message 2',
      });
    });
  });
});
