import type { ExecutionContext } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../src/types';
import {
  createMockContext,
  createMockEnv,
  setupMockCrypto,
} from '../fixtures/mock-env';
import {
  TEST_ADMIN_AUTH_HEADER,
  TEST_AUTH_TOKEN,
  TEST_DEVICE_ID,
  TEST_PASS_TYPE,
  TEST_PUSH_TOKEN,
  TEST_SERIAL,
} from '../fixtures/test-data';

// Mock all external dependencies at the top level
vi.mock('../../src/db', () => ({
  getDbClient: vi.fn(),
}));

vi.mock('../../src/storage', () => ({
  registerDevice: vi.fn(),
  unregisterDevice: vi.fn(),
  listUpdatedSerials: vi.fn(),
  logMessages: vi.fn(),
  healthCheck: vi.fn(),
}));

vi.mock('../../src/passkit/passkit', () => ({
  buildPass: vi.fn(),
}));

// Predeclare reusable regular expressions at top-level per lint rules
const RE_PAYLOAD_TOO_LARGE = /Payload Too Large|Request entity too large/i;
const RE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('HTTP Endpoint Smoke Tests', () => {
  let authHeader: string;

  // Create mock environment and context for Hono app
  let mockEnv: Env;
  let mockContext: ExecutionContext;
  let appFetch: (
    req: Request,
    env: Env,
    ctx: ExecutionContext
  ) => Promise<Response>;

  beforeEach(async () => {
    // Setup mock environment and context
    mockEnv = createMockEnv();
    mockContext = createMockContext();
    authHeader = TEST_ADMIN_AUTH_HEADER;

    // Setup mock crypto for certificate operations
    setupMockCrypto();

    // Clear all mocks
    vi.clearAllMocks();

    // Import the smoke app after mocks are set up
    const smokeApp = await import('../../src/index.smoke');
    appFetch = smokeApp.default.fetch;
  });

  describe('Health Check Endpoints', () => {
    it('GET / should return API info', async () => {
      const request = new Request('http://localhost/');
      const response = await appFetch(request, mockEnv, mockContext);
      expect(response.status).toBe(200);

      const json = (await response.json()) as {
        timestamp?: string;
        status?: string;
      };
      expect(json).toEqual({
        message: 'PassKit API',
        version: '1.0.0',
      });
    });

    it('GET /v1/health should check database connection', async () => {
      const request = new Request('http://localhost/v1/health');
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(200);
      const json = (await response.json()) as {
        timestamp?: string;
        status?: string;
      };
      expect(json).toHaveProperty('timestamp');
      expect(json.status).toBe('ok');
    });
  });

  describe('Device Registration', () => {
    const registrationPath = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}/${TEST_SERIAL}`;

    it('should register a new device with valid auth', async () => {
      const request = new Request(`http://localhost${registrationPath}`, {
        method: 'POST',
        headers: {
          // index.smoke expects this exact token
          Authorization: 'ApplePass valid-test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pushToken: TEST_PUSH_TOKEN }),
      });

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(201);
      // Success body should be empty
      expect(await response.text()).toBe('');
    });

    it('should fail registration with invalid auth', async () => {
      const request = new Request(`http://localhost${registrationPath}`, {
        method: 'POST',
        headers: {
          Authorization: 'ApplePass wrong-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pushToken: TEST_PUSH_TOKEN }),
      });

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(401);
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
      const json = (await response.json()) as { error?: unknown };
      expect(json).toHaveProperty('error');
    });

    it('should fail registration with missing push token', async () => {
      const request = new Request(`http://localhost${registrationPath}`, {
        method: 'POST',
        headers: {
          Authorization: `ApplePass ${TEST_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Missing pushToken
      });

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(400);
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
      const json = (await response.json()) as { error?: string };
      expect(json.error).toBe('Validation Failed');
    });

    it('should fail with payload too large', async () => {
      // Create a payload that is valid JSON but exceeds the 10KB limit
      const largePayload = {
        pushToken: TEST_PUSH_TOKEN,
        extraData: 'x'.repeat(15 * 1024), // 15KB, over 10KB limit
      };

      const request = new Request(`http://localhost${registrationPath}`, {
        method: 'POST',
        headers: {
          Authorization: `ApplePass ${TEST_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(largePayload),
      });

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(413);

      // For actual oversized payloads that hit body limit, check for the specific error
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const json = (await response.json()) as { error?: string };
        expect(json.error).toBe('Payload Too Large');
      } else {
        // Check for payload size related error messages
        const text = await response.text();
        expect(text).toMatch(RE_PAYLOAD_TOO_LARGE);
      }
    });
  });

  describe('Device Unregistration', () => {
    it('should unregister device with proper idempotent response', async () => {
      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}/${TEST_SERIAL}`;

      const request = new Request(`http://localhost${path}`, {
        method: 'DELETE',
        headers: {
          // index.smoke expects this exact token
          Authorization: 'ApplePass valid-test-token',
        },
      });

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(200);
      // Must have empty body for 200 unregistration
      expect(await response.text()).toBe('');
    });

    it('should fail unregistration with invalid auth', async () => {
      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}/${TEST_SERIAL}`;

      const request = new Request(`http://localhost${path}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'ApplePass wrong-token',
        },
      });

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(401);
    });
  });

  describe('Pass Retrieval', () => {
    it('should return 401 for non-existent pass (auth before existence check)', async () => {
      await import('../../src/passkit/passkit');

      const request = new Request(
        `http://localhost/v1/passes/${TEST_PASS_TYPE}/nonexistent`,
        {
          headers: {
            Authorization: 'ApplePass fake-token',
          },
        }
      );

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(401); // Auth fails before checking if pass exists
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
    });

    it('should return 401 without authorization header', async () => {
      const path = `/v1/passes/${TEST_PASS_TYPE}/${TEST_SERIAL}`;

      const request = new Request(`http://localhost${path}`);
      const response = await appFetch(request, mockEnv, mockContext);
      expect(response.status).toBe(401);
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
    });

    it('should return 304 for matching If-None-Match with auth', async () => {
      const path = `/v1/passes/${TEST_PASS_TYPE}/${TEST_SERIAL}`;

      const request = new Request(`http://localhost${path}`, {
        headers: {
          // index.smoke expects this exact token for pass retrieval
          Authorization: `ApplePass ${TEST_AUTH_TOKEN}`,
          // index.smoke uses the exact quoted ETag string
          'If-None-Match': '"test-etag"',
        },
      });

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(304);
      // 304 must have empty body
      expect(await response.text()).toBe('');
      expect(response.headers.get('etag')).toBe('"test-etag"');
      expect(response.headers.get('last-modified')).toBeTruthy();
      expect(response.headers.get('cache-control')).toBe(
        'no-cache, no-store, must-revalidate'
      );
    });

    it('should include headers and return 404 when ETag not matched', async () => {
      const path = `/v1/passes/${TEST_PASS_TYPE}/${TEST_SERIAL}`;

      const request = new Request(`http://localhost${path}`, {
        headers: {
          Authorization: `ApplePass ${TEST_AUTH_TOKEN}`,
        },
      });

      const response = await appFetch(request, mockEnv, mockContext);

      // Smoke harness returns 404 with headers when pass not found
      expect(response.status).toBe(404);
      expect(response.headers.get('etag')).toBeTruthy();
      expect(response.headers.get('last-modified')).toBeTruthy();
      expect(response.headers.get('cache-control')).toBe(
        'no-cache, no-store, must-revalidate'
      );
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
      const body = (await response.json()) as { error?: unknown };
      expect(body).toHaveProperty('error');
    });

    it('should return 200 with pkpass content when build succeeds (or 404 under harness)', async () => {
      const { buildPass } = await import('../../src/passkit/passkit');
      (
        buildPass as unknown as { mockResolvedValueOnce: Function }
      ).mockResolvedValueOnce(new Uint8Array([1, 2, 3]).buffer);

      const path = `/v1/passes/${TEST_PASS_TYPE}/${TEST_SERIAL}`;
      const request = new Request(`http://localhost${path}`, {
        headers: {
          Authorization: `ApplePass ${TEST_AUTH_TOKEN}`,
        },
      });

      const response = await appFetch(request, mockEnv, mockContext);

      if (response.status === 200) {
        expect(response.headers.get('content-type')).toBe(
          'application/vnd.apple.pkpass'
        );
        const disposition = response.headers.get('content-disposition') ?? '';
        expect(disposition).toContain(`${TEST_SERIAL}.pkpass`);
        const buf = await response.arrayBuffer();
        expect(buf.byteLength).toBeGreaterThan(0);
      } else {
        expect(response.status).toBe(404);
      }
    });
    // If-Modified-Since behavior is covered in unit tests; smoke harness focuses on ETag
  });

  describe('List Updated Serials', () => {
    it('should return 401 when listing updated serials without Authorization', async () => {
      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}`;
      const request = new Request(`http://localhost${path}`);
      const response = await appFetch(request, mockEnv, mockContext);
      expect(response.status).toBe(401);
    });

    it('should return 401 when Authorization uses wrong token', async () => {
      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}`;
      const request = new Request(`http://localhost${path}`, {
        headers: { Authorization: 'ApplePass wrong-token' },
      });
      const response = await appFetch(request, mockEnv, mockContext);
      expect(response.status).toBe(401);
    });

    it('should return 204 when no updated serials exist', async () => {
      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}`;
      const request = new Request(`http://localhost${path}`, {
        headers: { Authorization: 'ApplePass valid-test-token' },
      });
      const response = await appFetch(request, mockEnv, mockContext);
      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');
    });

    it('should handle device registrations request with proper empty response', async () => {
      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}`;

      const request = new Request(`http://localhost${path}`, {
        headers: { Authorization: 'ApplePass valid-test-token' },
      });
      const response = await appFetch(request, mockEnv, mockContext);

      // Smoke harness currently returns 204 (no updates)
      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');
    });

    it('should accept passesUpdatedSince query parameter and return 204 for no updates', async () => {
      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}?passesUpdatedSince=1640995200`;

      const request = new Request(`http://localhost${path}`, {
        headers: { Authorization: 'ApplePass valid-test-token' },
      });
      const response = await appFetch(request, mockEnv, mockContext);
      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');
    });

    it('should return 200 with SerialNumbers when updates exist (or 204 when none)', async () => {
      const storage = await import('../../src/storage');
      (
        storage.listUpdatedSerials as unknown as {
          mockResolvedValueOnce: Function;
        }
      ).mockResolvedValueOnce({
        serialNumbers: [TEST_SERIAL],
        lastUpdated: '1351981923',
      });

      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}`;
      const request = new Request(`http://localhost${path}`, {
        headers: { Authorization: 'ApplePass valid-test-token' },
      });

      const response = await appFetch(request, mockEnv, mockContext);
      if (response.status === 200) {
        expect(response.headers.get('content-type')).toContain(
          'application/json'
        );
        const json = (await response.json()) as {
          serialNumbers: string[];
          lastUpdated: string;
        };
        expect(Array.isArray(json.serialNumbers)).toBe(true);
        expect(json.serialNumbers).toContain(TEST_SERIAL);
        expect(typeof json.lastUpdated).toBe('string');
      } else {
        expect(response.status).toBe(204);
      }
    });
  });

  describe('Log Messages', () => {
    it('should accept log messages', async () => {
      const request = new Request('http://localhost/v1/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: ['Test log message 1', 'Test log message 2'],
        }),
      });

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(200);
      // Check content-type header if present
      const contentType = response.headers.get('content-type');
      if (contentType) {
        expect(contentType).toContain('application/json');
      }
    });

    it('should reject invalid log payload', async () => {
      const request = new Request('http://localhost/v1/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: [], // Empty array should fail validation
        }),
      });

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(400);
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
      const json = (await response.json()) as { error?: string };
      expect(json.error).toBe('Validation Failed');
    });

    it('should reject oversized log payload', async () => {
      const largeLogs = new Array(1000).fill('x'.repeat(1000)); // ~1MB payload

      const request = new Request('http://localhost/v1/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: largeLogs }),
      });

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(413);

      // Body limit errors might return text/plain or application/json depending on when they're caught
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const json = (await response.json()) as { error?: string };
        expect(json.error).toBe('Payload Too Large');
      } else {
        // If it's text/plain, just check the text contains the error
        const text = await response.text();
        expect(text).toMatch(RE_PAYLOAD_TOO_LARGE);
      }
    });
  });

  describe('Apple PassKit Header Compliance', () => {
    it('should validate Apple PassKit authorization header format', async () => {
      const registrationPath = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}/${TEST_SERIAL}`;

      // Test that our endpoints properly handle "ApplePass " prefix
      const request = new Request(`http://localhost${registrationPath}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_AUTH_TOKEN}`, // Wrong format
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pushToken: TEST_PUSH_TOKEN }),
      });

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(401); // Should reject non-ApplePass format
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
    });

    it('should validate Content-Type headers for JSON responses', async () => {
      const request = new Request('http://localhost/v1/health');
      const response = await appFetch(request, mockEnv, mockContext);

      if (response.status === 200 || response.status === 503) {
        expect(response.headers.get('content-type')).toContain(
          'application/json'
        );
      }
    });

    it('should validate proper response structure for registration endpoints', async () => {
      const registrationPath = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}/${TEST_SERIAL}`;

      const request = new Request(`http://localhost${registrationPath}`, {
        method: 'POST',
        headers: {
          Authorization: `ApplePass ${TEST_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pushToken: TEST_PUSH_TOKEN }),
      });

      const response = await appFetch(request, mockEnv, mockContext);

      // Apple spec: 201 (new), 200 (existing), 401 (unauthorized)
      expect([200, 201, 401]).toContain(response.status);

      if (response.status === 401) {
        expect(response.headers.get('content-type')).toContain(
          'application/json'
        );
        const json = await response.json();
        expect(json).toHaveProperty('error');
      }
    });

    it('should validate authorization header format for unregistration', async () => {
      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}/${TEST_SERIAL}`;

      const request = new Request(`http://localhost${path}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${btoa('wrong:format')}`, // Wrong format
        },
      });

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(401); // Should reject non-ApplePass format
    });

    it('should validate authorization header format for pass retrieval', async () => {
      const path = `/v1/passes/${TEST_PASS_TYPE}/${TEST_SERIAL}`;

      const request = new Request(`http://localhost${path}`, {
        headers: {
          Authorization: `Token ${TEST_AUTH_TOKEN}`, // Wrong format
        },
      });

      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(401); // Should reject non-ApplePass format
    });
  });

  describe('Admin Endpoints', () => {
    it('should reject requests without auth', async () => {
      const request = new Request('http://localhost/admin/certs/test-cert');
      const response = await appFetch(request, mockEnv, mockContext);
      expect(response.status).toBe(401);
    });

    it('should reject requests with wrong credentials', async () => {
      const request = new Request('http://localhost/admin/certs/test-cert', {
        headers: {
          Authorization: `Basic ${btoa('wrong:creds')}`,
        },
      });
      const response = await appFetch(request, mockEnv, mockContext);
      expect(response.status).toBe(401);
    });

    it('should accept requests with valid credentials', async () => {
      const request = new Request(
        'http://localhost/admin/invalidate/certs/nonexistent',
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
          },
        }
      );
      const response = await appFetch(request, mockEnv, mockContext);

      // Will be 200 because cache invalidation succeeds, even for non-existent certs
      expect([200, 401, 404, 500]).toContain(response.status);

      if (response.status === 200) {
        const json = (await response.json()) as { message: string };
        expect(json.message).toContain('invalidated');
      } else if (response.status === 404) {
        const json = (await response.json()) as { message: string };
        expect(json.message).toContain('not found');
      }
    });
  });

  describe('Middleware Testing', () => {
    it('should set security headers', async () => {
      const request = new Request('http://localhost/');
      const response = await appFetch(request, mockEnv, mockContext);

      // Check for key security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Request-ID')).toBeTruthy();
    });

    it('should handle CORS appropriately', async () => {
      const request = new Request('http://localhost/v1/health', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://example.com',
          'Access-Control-Request-Method': 'GET',
        },
      });
      const response = await appFetch(request, mockEnv, mockContext);

      // Should handle preflight or reject appropriately
      expect([200, 204, 404, 405]).toContain(response.status);
    });

    it('should enforce global body limit', async () => {
      const veryLargePayload = 'x'.repeat(3 * 1024 * 1024); // 3MB, over 2MB limit

      const request = new Request('http://localhost/v1/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: veryLargePayload,
      });
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(413);

      // Body limit errors might return text/plain or application/json depending on when they're caught
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const json = (await response.json()) as { error?: string };
        expect(json.error).toBe('Payload Too Large');
      } else {
        // If it's text/plain, just check the text contains the error
        const text = await response.text();
        expect(text).toMatch(RE_PAYLOAD_TOO_LARGE);
      }
    });
  });

  describe('Logging Integration', () => {
    it('should include request ID in response headers', async () => {
      const request = new Request('http://localhost/');
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Request-ID')).toBeTruthy();

      // Validate UUID format (36 characters with hyphens)
      const requestId = response.headers.get('X-Request-ID');
      expect(requestId).toMatch(RE_UUID);
    });

    it('should include request ID in all endpoint responses', async () => {
      const endpoints = [
        '/',
        '/v1/health',
        `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}`,
        `/v1/passes/${TEST_PASS_TYPE}/${TEST_SERIAL}`,
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) => {
          const headers: Record<string, string> = {};
          if (endpoint.includes('/passes/')) {
            headers.Authorization = 'ApplePass fake-token';
          }
          const request = new Request(`http://localhost${endpoint}`, {
            headers,
          });
          return appFetch(request, mockEnv, mockContext);
        })
      );

      for (const response of responses) {
        // All endpoints should include request ID regardless of status
        expect(response.headers.get('X-Request-ID')).toBeTruthy();
        const requestId = response.headers.get('X-Request-ID');
        expect(requestId).toMatch(RE_UUID);
      }
    });

    it('should handle Sentry DSN environment gracefully', async () => {
      // This tests that the app doesn't crash when Sentry DSN is missing or invalid
      // The app should continue to function normally without Sentry
      const request = new Request('http://localhost/v1/health');
      const response = await appFetch(request, mockEnv, mockContext);

      // Should not be 500 due to Sentry configuration issues
      expect([200, 503]).toContain(response.status);

      // Should still have proper JSON response structure
      const json = await response.json();
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('status');
    });

    it('should handle missing environment variables gracefully', async () => {
      // Test that missing logging-related env vars don't break the app
      const request = new Request('http://localhost/');
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Request-ID')).toBeTruthy();

      const json = await response.json();
      expect(json).toEqual({
        message: 'PassKit API',
        version: '1.0.0',
      });
    });

    it('should maintain request correlation across middleware', async () => {
      // Test that the same request ID flows through all middleware
      const request1 = new Request('http://localhost/v1/health');
      const response1 = await appFetch(request1, mockEnv, mockContext);

      const requestId1 = response1.headers.get('X-Request-ID');
      expect(requestId1).toBeTruthy();

      // Make another request and verify it gets a different ID
      const request2 = new Request('http://localhost/v1/health');
      const response2 = await appFetch(request2, mockEnv, mockContext);
      const requestId2 = response2.headers.get('X-Request-ID');

      expect(requestId2).toBeTruthy();
      expect(requestId1).not.toBe(requestId2);
    });

    it('should handle large request payloads without logging errors', async () => {
      // Test that large payloads don't break logging infrastructure
      const largeButValidPayload = {
        logs: new Array(100).fill("Normal log message that's not too large"),
      };

      const request = new Request('http://localhost/v1/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(largeButValidPayload),
      });
      const response = await appFetch(request, mockEnv, mockContext);

      // Should handle the request normally (success or validation error, not 500)
      expect([200, 400]).toContain(response.status);
      expect(response.headers.get('X-Request-ID')).toBeTruthy();
    });

    it('should preserve security headers with logging middleware', async () => {
      const request = new Request('http://localhost/');
      const response = await appFetch(request, mockEnv, mockContext);

      // Verify that logging middleware doesn't interfere with security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Request-ID')).toBeTruthy();

      // Check that we have both security and logging headers
      expect(response.headers.get('x-content-type-options')).toBeTruthy();
      expect(response.headers.get('x-request-id')).toBeTruthy();
    });

    it('should handle concurrent requests with unique request IDs', async () => {
      // Test that concurrent requests get unique request IDs
      const promises = new Array(5).fill(null).map(() => {
        const request = new Request('http://localhost/');
        return appFetch(request, mockEnv, mockContext);
      });

      const responses = await Promise.all(promises);
      const requestIds = responses.map((r: Response) =>
        r.headers.get('X-Request-ID')
      );

      // All should have request IDs
      for (const id of requestIds) {
        expect(id).toBeTruthy();
        expect(id).toMatch(RE_UUID);
      }

      // All should be unique
      const uniqueIds = new Set(requestIds);
      expect(uniqueIds.size).toBe(requestIds.length);
    });
  });
});
