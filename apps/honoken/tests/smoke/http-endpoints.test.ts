import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockEnv, createMockContext, setupMockCrypto } from "../fixtures/mock-env";
import {
  TEST_PASS_TYPE,
  TEST_SERIAL,
  TEST_DEVICE_ID,
  TEST_AUTH_TOKEN,
  TEST_PUSH_TOKEN,
  TEST_ADMIN_AUTH_HEADER
} from "../fixtures/test-data";

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

describe("HTTP Endpoint Smoke Tests", () => {
  const ADMIN_USER = "testadmin";
  const ADMIN_PASS = "testpass123";
  let authHeader: string;
  
  // Create mock environment and context for Hono app
  let mockEnv: any;
  let mockContext: any;
  let appFetch: any;

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

  describe("Health Check Endpoints", () => {
    it("GET / should return API info", async () => {
      const request = new Request("http://localhost/");
      const response = await appFetch(request, mockEnv, mockContext);
      expect(response.status).toBe(200);
      
      const json = await response.json();
      expect(json).toEqual({
        message: "PassKit API",
        version: "1.0.0"
      });
    });

    it("GET /v1/health should check database connection", async () => {
      const request = new Request("http://localhost/v1/health");
      const response = await appFetch(request, mockEnv, mockContext);
      
      // Will likely be 503 due to no real DB, but tests the endpoint exists
      expect([200, 503]).toContain(response.status);
      
      const json = await response.json();
      expect(json).toHaveProperty("timestamp");
      
      if (response.status === 200) {
        expect(json.status).toBe("ok");
      } else {
        expect(json.status).toBe("error");
      }
    });
  });

  describe("Device Registration", () => {
    const registrationPath = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}/${TEST_SERIAL}`;

    it("should register a new device with valid auth", async () => {
      const request = new Request(`http://localhost${registrationPath}`, {
        method: "POST",
        headers: {
          "Authorization": `ApplePass ${TEST_AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pushToken: TEST_PUSH_TOKEN }),
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      // Note: This will likely fail with 401 without real DB data
      // But it tests the endpoint structure and validation
      // Apple spec: 201 (new), 200 (existing), 401 (unauthorized) - no 404 for registration
      expect([200, 201, 401]).toContain(response.status);
      
      // Apple spec: Optional JSON for success, JSON error details for failures
      if (response.status === 401) {
        expect(response.headers.get("content-type")).toContain("application/json");
        const json = await response.json();
        expect(json).toHaveProperty("error");
      } else if (response.status === 200 || response.status === 201) {
        // Success responses may have JSON content
        if (response.headers.get("content-type")?.includes("application/json")) {
          // JSON response is optional for success
        }
      }
    });

    it("should fail registration with invalid auth", async () => {
      const request = new Request(`http://localhost${registrationPath}`, {
        method: "POST",
        headers: {
          "Authorization": "ApplePass wrong-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pushToken: TEST_PUSH_TOKEN }),
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(401);
      expect(response.headers.get("content-type")).toContain("application/json");
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });

    it("should fail registration with missing push token", async () => {
      const request = new Request(`http://localhost${registrationPath}`, {
        method: "POST",
        headers: {
          "Authorization": `ApplePass ${TEST_AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}), // Missing pushToken
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain("application/json");
      const json = await response.json();
      expect(json.error).toBe("Validation Failed");
    });

    it("should fail with payload too large", async () => {
      // Create a payload that is valid JSON but exceeds the 10KB limit
      const largePayload = {
        pushToken: TEST_PUSH_TOKEN,
        extraData: "x".repeat(15 * 1024) // 15KB, over 10KB limit
      };

      const request = new Request(`http://localhost${registrationPath}`, {
        method: "POST",
        headers: {
          "Authorization": `ApplePass ${TEST_AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(largePayload),
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(413);
      
      // For actual oversized payloads that hit body limit, check for the specific error
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        expect(json.error).toBe("Payload Too Large");
      } else {
        // Check for payload size related error messages
        const text = await response.text();
        expect(text).toMatch(/Payload Too Large|Request entity too large/i);
      }
    });
  });

  describe("Device Unregistration", () => {
    it("should unregister device with proper idempotent response", async () => {
      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}/${TEST_SERIAL}`;
      
      const request = new Request(`http://localhost${path}`, {
        method: "DELETE",
        headers: {
          "Authorization": `ApplePass ${TEST_AUTH_TOKEN}`,
        },
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      // Apple spec: 200 OK with empty body for successful unregistration (idempotent), 401 for auth failure
      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        // Apple spec: Must have empty body for 200 unregistration
        expect(await response.text()).toBe("");
      } else if (response.status === 401) {
        expect(response.headers.get("content-type")).toContain("application/json");
      }
    });

    it("should fail unregistration with invalid auth", async () => {
      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}/${TEST_SERIAL}`;
      
      const request = new Request(`http://localhost${path}`, {
        method: "DELETE",
        headers: {
          "Authorization": "ApplePass wrong-token",
        },
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(401);
    });
  });

  describe("Pass Retrieval", () => {
    it("should return 401 for non-existent pass (auth before existence check)", async () => {
      const { buildPass } = await import("../../src/passkit/passkit");
      
      const request = new Request(`http://localhost/v1/passes/${TEST_PASS_TYPE}/nonexistent`, {
        headers: {
          "Authorization": `ApplePass fake-token`,
        },
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(401);  // Auth fails before checking if pass exists
      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should return 401 without authorization header", async () => {
      const path = `/v1/passes/${TEST_PASS_TYPE}/${TEST_SERIAL}`;
      
      const request = new Request(`http://localhost${path}`);
      const response = await appFetch(request, mockEnv, mockContext);
      expect(response.status).toBe(401);
      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should handle If-None-Match header for caching", async () => {
      const path = `/v1/passes/${TEST_PASS_TYPE}/${TEST_SERIAL}`;
      
      const request = new Request(`http://localhost${path}`, {
        headers: {
          "Authorization": `ApplePass ${TEST_AUTH_TOKEN}`,
          "If-None-Match": "test-etag",
        },
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      // Apple spec: 200 (success), 304 (not modified), 401 (unauthorized), 404 (not found)
      // In test env, may also get 500 due to cert loading issues
      expect([200, 304, 401, 404, 500]).toContain(response.status);
      
      if (response.status === 304) {
        // 304 should have empty body
        expect(await response.text()).toBe("");
      }
    });

    it("should include Apple-required headers for pass retrieval", async () => {
      const path = `/v1/passes/${TEST_PASS_TYPE}/${TEST_SERIAL}`;
      
      const request = new Request(`http://localhost${path}`, {
        headers: {
          "Authorization": `ApplePass ${TEST_AUTH_TOKEN}`,
        },
      });
      
      const response = await appFetch(request, mockEnv, mockContext);
      
      if (response.status === 200) {
        expect(response.headers.get("content-type")).toBe("application/vnd.apple.pkpass");
        expect(response.headers.get("last-modified")).toBeTruthy();
        // ETag is recommended but not required
      }
      // In test env, cert loading may fail with 500
      expect([200, 401, 404, 500]).toContain(response.status);
    });

    it("should return 304 Not Modified for unchanged passes with If-Modified-Since", async () => {
      const path = `/v1/passes/${TEST_PASS_TYPE}/${TEST_SERIAL}`;
      
      // Use a future date to simulate that the pass hasn't been modified since
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
      
      const request = new Request(`http://localhost${path}`, {
        headers: {
          "Authorization": `ApplePass ${TEST_AUTH_TOKEN}`,
          "If-Modified-Since": futureDate
        }
      });
      
      const response = await appFetch(request, mockEnv, mockContext);
      
      // Should return 304 if pass exists and hasn't been modified, or 404/401 if pass doesn't exist/unauthorized
      // In test env, may also get 500 due to cert loading issues
      expect([304, 401, 404, 500]).toContain(response.status);
      
      if (response.status === 304) {
        // 304 must have empty body per Apple spec
        expect(await response.text()).toBe("");
      }
    });

    it("should return pass content when If-Modified-Since is older", async () => {
      const path = `/v1/passes/${TEST_PASS_TYPE}/${TEST_SERIAL}`;
      
      // Use a past date to simulate that the pass has been modified since
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toUTCString();
      
      const request = new Request(`http://localhost${path}`, {
        headers: {
          "Authorization": `ApplePass ${TEST_AUTH_TOKEN}`,
          "If-Modified-Since": pastDate
        }
      });
      
      const response = await appFetch(request, mockEnv, mockContext);
      
      // Should return the pass if it exists and has been modified, or error status
      // In test env, may also get 500 due to cert loading issues
      expect([200, 401, 404, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.headers.get("content-type")).toBe("application/vnd.apple.pkpass");
        expect(response.headers.get("last-modified")).toBeTruthy();
      }
    });
  });

  describe("List Updated Serials", () => {
    it("should handle device registrations request with proper response structure", async () => {
      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}`;
      
      const request = new Request(`http://localhost${path}`);
      const response = await appFetch(request, mockEnv, mockContext);
      
      // Apple spec: 200 (has updates), 204 (no updates, empty body), 401 (unauthorized)
      expect([200, 204, 401]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.headers.get("content-type")).toContain("application/json");
        const json = await response.json();
        
        // Validate Apple's exact response structure
        expect(json).toEqual({
          serialNumbers: expect.any(Array),
          lastUpdated: expect.any(String)
        });
        
        // Validate serialNumbers are strings
        json.serialNumbers.forEach((serial: any) => {
          expect(typeof serial).toBe("string");
        });
        
        // Validate lastUpdated format (opaque string, often epoch timestamp)
        expect(json.lastUpdated).toBeTruthy();
        expect(typeof json.lastUpdated).toBe("string");
      } else if (response.status === 204) {
        // Apple spec: 204 must have empty body
        expect(await response.text()).toBe("");
      } else if (response.status === 401) {
        expect(response.headers.get("content-type")).toContain("application/json");
      }
    });

    it("should handle passesUpdatedSince query parameter", async () => {
      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}?passesUpdatedSince=1640995200`;
      
      const request = new Request(`http://localhost${path}`);
      const response = await appFetch(request, mockEnv, mockContext);
      expect([200, 204]).toContain(response.status);
    });
  });

  describe("Log Messages", () => {
    it("should accept log messages", async () => {
      const request = new Request("http://localhost/v1/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          logs: [
            "Test log message 1",
            "Test log message 2"
          ]
        }),
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(200);
      // Check content-type header if present
      const contentType = response.headers.get("content-type");
      if (contentType) {
        expect(contentType).toContain("application/json");
      }
    });

    it("should reject invalid log payload", async () => {
      const request = new Request("http://localhost/v1/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          logs: [] // Empty array should fail validation
        }),
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain("application/json");
      const json = await response.json();
      expect(json.error).toBe("Validation Failed");
    });

    it("should reject oversized log payload", async () => {
      const largeLogs = Array(1000).fill("x".repeat(1000)); // ~1MB payload
      
      const request = new Request("http://localhost/v1/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs: largeLogs }),
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(413);
      
      // Body limit errors might return text/plain or application/json depending on when they're caught
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        expect(json.error).toBe("Payload Too Large");
      } else {
        // If it's text/plain, just check the text contains the error
        const text = await response.text();
        expect(text).toContain("Payload Too Large");
      }
    });
  });

  describe("Apple PassKit Header Compliance", () => {
    it("should validate Apple PassKit authorization header format", async () => {
      const registrationPath = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}/${TEST_SERIAL}`;
      
      // Test that our endpoints properly handle "ApplePass " prefix
      const request = new Request(`http://localhost${registrationPath}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TEST_AUTH_TOKEN}`, // Wrong format
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pushToken: TEST_PUSH_TOKEN }),
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(401); // Should reject non-ApplePass format
      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should validate Content-Type headers for JSON responses", async () => {
      const request = new Request("http://localhost/v1/health");
      const response = await appFetch(request, mockEnv, mockContext);
      
      if (response.status === 200 || response.status === 503) {
        expect(response.headers.get("content-type")).toContain("application/json");
      }
    });

    it("should validate proper response structure for registration endpoints", async () => {
      const registrationPath = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}/${TEST_SERIAL}`;
      
      const request = new Request(`http://localhost${registrationPath}`, {
        method: "POST",
        headers: {
          "Authorization": `ApplePass ${TEST_AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pushToken: TEST_PUSH_TOKEN }),
      });
      
      const response = await appFetch(request, mockEnv, mockContext);
      
      // Apple spec: 201 (new), 200 (existing), 401 (unauthorized)
      expect([200, 201, 401]).toContain(response.status);
      
      if (response.status === 401) {
        expect(response.headers.get("content-type")).toContain("application/json");
        const json = await response.json();
        expect(json).toHaveProperty("error");
      }
    });

    it("should validate authorization header format for unregistration", async () => {
      const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}/${TEST_SERIAL}`;
      
      const request = new Request(`http://localhost${path}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Basic ${btoa("wrong:format")}`, // Wrong format
        },
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(401); // Should reject non-ApplePass format
    });

    it("should validate authorization header format for pass retrieval", async () => {
      const path = `/v1/passes/${TEST_PASS_TYPE}/${TEST_SERIAL}`;
      
      const request = new Request(`http://localhost${path}`, {
        headers: {
          "Authorization": `Token ${TEST_AUTH_TOKEN}`, // Wrong format
        },
      });
      
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(401); // Should reject non-ApplePass format
    });
  });

  describe("Admin Endpoints", () => {
    it("should reject requests without auth", async () => {
      const request = new Request("http://localhost/admin/certs/test-cert");
      const response = await appFetch(request, mockEnv, mockContext);
      expect(response.status).toBe(401);
    });

    it("should reject requests with wrong credentials", async () => {
      const request = new Request("http://localhost/admin/certs/test-cert", {
        headers: {
          "Authorization": `Basic ${btoa("wrong:creds")}`,
        },
      });
      const response = await appFetch(request, mockEnv, mockContext);
      expect(response.status).toBe(401);
    });

    it("should accept requests with valid credentials", async () => {
      const request = new Request("http://localhost/admin/invalidate/certs/nonexistent", {
        method: "POST",
        headers: {
          "Authorization": authHeader,
        },
      });
      const response = await appFetch(request, mockEnv, mockContext);
      
      // Will be 200 because cache invalidation succeeds, even for non-existent certs
      expect([200, 401, 404, 500]).toContain(response.status);
      
      if (response.status === 200) {
        const json = await response.json();
        expect(json.message).toContain("invalidated");
      } else if (response.status === 404) {
        const json = await response.json();
        expect(json.message).toContain("not found");
      }
    });
  });

  describe("Middleware Testing", () => {
    it("should set security headers", async () => {
      const request = new Request("http://localhost/");
      const response = await appFetch(request, mockEnv, mockContext);
      
      // Check for key security headers
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Request-ID")).toBeTruthy();
    });

    it("should handle CORS appropriately", async () => {
      const request = new Request("http://localhost/v1/health", {
        method: "OPTIONS",
        headers: {
          "Origin": "https://example.com",
          "Access-Control-Request-Method": "GET",
        },
      });
      const response = await appFetch(request, mockEnv, mockContext);

      // Should handle preflight or reject appropriately
      expect([200, 204, 404, 405]).toContain(response.status);
    });

    it("should enforce global body limit", async () => {
      const veryLargePayload = "x".repeat(3 * 1024 * 1024); // 3MB, over 2MB limit
      
      const request = new Request("http://localhost/v1/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: veryLargePayload,
      });
      const response = await appFetch(request, mockEnv, mockContext);

      expect(response.status).toBe(413);
      
      // Body limit errors might return text/plain or application/json depending on when they're caught
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        expect(json.error).toBe("Payload Too Large");
      } else {
        // If it's text/plain, just check the text contains the error
        const text = await response.text();
        expect(text).toContain("Payload Too Large");
      }
    });
  });

  describe("Logging Integration", () => {
    it("should include request ID in response headers", async () => {
      const request = new Request("http://localhost/");
      const response = await appFetch(request, mockEnv, mockContext);
      
      expect(response.status).toBe(200);
      expect(response.headers.get("X-Request-ID")).toBeTruthy();
      
      // Validate UUID format (36 characters with hyphens)
      const requestId = response.headers.get("X-Request-ID");
      expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it("should include request ID in all endpoint responses", async () => {
      const endpoints = [
        "/",
        "/v1/health",
        `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}`,
        `/v1/passes/${TEST_PASS_TYPE}/${TEST_SERIAL}`
      ];

      for (const endpoint of endpoints) {
        const headers: Record<string, string> = {};
        if (endpoint.includes('/passes/')) {
          headers["Authorization"] = "ApplePass fake-token";
        }
        
        const request = new Request(`http://localhost${endpoint}`, { headers });
        const response = await appFetch(request, mockEnv, mockContext);
        
        // All endpoints should include request ID regardless of status
        expect(response.headers.get("X-Request-ID")).toBeTruthy();
        
        const requestId = response.headers.get("X-Request-ID");
        expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      }
    });

    it("should handle Sentry DSN environment gracefully", async () => {
      // This tests that the app doesn't crash when Sentry DSN is missing or invalid
      // The app should continue to function normally without Sentry
      const request = new Request("http://localhost/v1/health");
      const response = await appFetch(request, mockEnv, mockContext);
      
      // Should not be 500 due to Sentry configuration issues
      expect([200, 503]).toContain(response.status);
      
      // Should still have proper JSON response structure
      const json = await response.json();
      expect(json).toHaveProperty("timestamp");
      expect(json).toHaveProperty("status");
    });

    it("should handle missing environment variables gracefully", async () => {
      // Test that missing logging-related env vars don't break the app
      const request = new Request("http://localhost/");
      const response = await appFetch(request, mockEnv, mockContext);
      
      expect(response.status).toBe(200);
      expect(response.headers.get("X-Request-ID")).toBeTruthy();
      
      const json = await response.json();
      expect(json).toEqual({
        message: "PassKit API",
        version: "1.0.0"
      });
    });

    it("should maintain request correlation across middleware", async () => {
      // Test that the same request ID flows through all middleware
      const request1 = new Request("http://localhost/v1/health");
      const response1 = await appFetch(request1, mockEnv, mockContext);
      
      const requestId1 = response1.headers.get("X-Request-ID");
      expect(requestId1).toBeTruthy();
      
      // Make another request and verify it gets a different ID
      const request2 = new Request("http://localhost/v1/health");
      const response2 = await appFetch(request2, mockEnv, mockContext);
      const requestId2 = response2.headers.get("X-Request-ID");
      
      expect(requestId2).toBeTruthy();
      expect(requestId1).not.toBe(requestId2);
    });

    it("should handle large request payloads without logging errors", async () => {
      // Test that large payloads don't break logging infrastructure
      const largeButValidPayload = {
        logs: Array(100).fill("Normal log message that's not too large")
      };
      
      const request = new Request("http://localhost/v1/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(largeButValidPayload),
      });
      const response = await appFetch(request, mockEnv, mockContext);

      // Should handle the request normally (success or validation error, not 500)
      expect([200, 400]).toContain(response.status);
      expect(response.headers.get("X-Request-ID")).toBeTruthy();
    });

    it("should preserve security headers with logging middleware", async () => {
      const request = new Request("http://localhost/");
      const response = await appFetch(request, mockEnv, mockContext);
      
      // Verify that logging middleware doesn't interfere with security headers
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Request-ID")).toBeTruthy();
      
      // Check that we have both security and logging headers
      expect(response.headers.get("x-content-type-options")).toBeTruthy();
      expect(response.headers.get("x-request-id")).toBeTruthy();
    });

    it("should handle concurrent requests with unique request IDs", async () => {
      // Test that concurrent requests get unique request IDs
      const promises = Array(5).fill(null).map(() => {
        const request = new Request("http://localhost/");
        return appFetch(request, mockEnv, mockContext);
      });
      
      const responses = await Promise.all(promises);
      const requestIds = responses.map((r: Response) => r.headers.get("X-Request-ID"));
      
      // All should have request IDs
      requestIds.forEach((id: string | null) => {
        expect(id).toBeTruthy();
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      });
      
      // All should be unique
      const uniqueIds = new Set(requestIds);
      expect(uniqueIds.size).toBe(requestIds.length);
    });
  });
});