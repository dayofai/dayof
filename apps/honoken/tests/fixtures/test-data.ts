// tests/fixtures/test-data.ts
// Test constants aligned with actual Honoken schema structure

export const TEST_PASS_TYPE = 'pass.com.example.test-event';
export const TEST_SERIAL = 'TEST-SMOKE-001';
export const TEST_DEVICE_ID = 'test-device-smoke-001';
export const TEST_AUTH_TOKEN = 'test-auth-smoke-12345';
export const TEST_PUSH_TOKEN = 'test-push-smoke-abcdef';
export const TEST_CERT_REF = 'test-cert-smoke';
export const TEST_TEAM_ID = 'TEST_TEAM_SMOKE';
export const TEST_APNS_KEY_REF = 'test-apns-key-smoke';
export const TEST_APNS_KEY_ID = 'TEST_KEY_ID';
export const TEST_PASS_CONTENT_ID = 'test-pass-content-001';

// Create proper test encrypted data that can be decrypted by mocked crypto
function createTestEncryptedData() {
  // Create a test certificate bundle
  const testCertBundle = {
    wwdr: '-----BEGIN CERTIFICATE-----\nTEST_WWDR_CERT\n-----END CERTIFICATE-----',
    signerCert:
      '-----BEGIN CERTIFICATE-----\nTEST_SIGNER_CERT\n-----END CERTIFICATE-----',
    signerKey:
      '-----BEGIN PRIVATE KEY-----\nTEST_SIGNER_KEY\n-----END PRIVATE KEY-----',
    signerKeyPassphrase: '',
  };

  // Convert to JSON and base64 encode for test purposes
  const bundleJson = JSON.stringify(testCertBundle);
  // In Node.js test environment, Buffer is preferred over btoa
  const base64Bundle = Buffer.from(bundleJson).toString('base64');

  // Create test IV, must be valid base64
  const testIv = Buffer.from('test-iv-1234').toString('base64'); // 12 bytes

  // Construct a valid versioned ciphertext string for testing
  // Format: "version:iv:encryptedData"
  const versionedCiphertext = `v1:${testIv}:${base64Bundle}`;

  return { versionedCiphertext, testCertBundle };
}

const { versionedCiphertext, testCertBundle } = createTestEncryptedData();

// Mock data aligned with actual schema from src/db/schema.ts
export const TEST_CERT_DATA = {
  certRef: TEST_CERT_REF,
  description: 'Test Certificate for Smoke Tests',
  isEnhanced: false,
  teamId: TEST_TEAM_ID,
  encryptedBundle: versionedCiphertext, // Properly formatted versioned ciphertext
  iv: '', // iv is now part of encryptedBundle, this field is deprecated
  updatedAt: new Date(),
  createdAt: new Date(),
};

// Export the test cert bundle for use in mocks
export const TEST_CERT_BUNDLE = testCertBundle;

export const TEST_APNS_KEY_DATA = {
  keyRef: TEST_APNS_KEY_REF,
  teamId: TEST_TEAM_ID,
  keyId: TEST_APNS_KEY_ID,
  isActive: true,
  encryptedP8Key: 'dGVzdC1lbmNyeXB0ZWQtcDgta2V5', // base64 "test-encrypted-p8-key"
  iv: '', // iv is part of encrypted data now
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const TEST_PASS_TYPE_DATA = {
  passTypeIdentifier: TEST_PASS_TYPE,
  certRef: TEST_CERT_REF,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Pass content data (represents a row in future pass_content table)
export const TEST_PASS_CONTENT_DATA = {
  id: TEST_PASS_CONTENT_ID,
  description: 'Test Event Ticket',
  organizationName: 'Test Organization',
  logoText: 'Test Event',
  eventName: 'Smoke Test Event',
  venueName: 'Test Venue',
  eventDateISO: '2025-06-01T19:30:00Z',
  seat: '12A',
  section: 'Test',
  barcode: {
    message: '1276451828321',
    format: 'PKBarcodeFormatQR',
    messageEncoding: 'iso-8859-1',
  },
  posterVersion: 1,
  semanticTags: {
    eventType: 'concert',
    priceCategory: 'premium',
    ageRestriction: 18,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Strictly valid passData per PassDataEventTicketSchema (no extra fields)
export const TEST_PASS_CONTENT_VALID = {
  description: 'Test Event Ticket',
  organizationName: 'Test Organization',
  logoText: 'Test Event',
  eventName: 'Smoke Test Event',
  venueName: 'Test Venue',
  eventDateISO: '2025-06-01T19:30:00Z',
  seat: '12A',
  section: 'Test',
  barcode: {
    message: '1276451828321',
    format: 'PKBarcodeFormatQR',
    messageEncoding: 'iso-8859-1',
  },
  posterVersion: 1,
  semanticTags: {
    eventType: 'concert',
    priceCategory: 'premium',
    ageRestriction: 18,
  },
} as const;

// Pass metadata (webservice table) - now with FK to pass content
export const TEST_PASS_DATA = {
  passTypeIdentifier: TEST_PASS_TYPE,
  serialNumber: TEST_SERIAL,
  authenticationToken: TEST_AUTH_TOKEN,
  ticketStyle: 'event' as const,
  poster: false,
  passContentId: TEST_PASS_CONTENT_ID, // FK to pass content
  etag: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const TEST_DEVICE_DATA = {
  deviceLibraryIdentifier: TEST_DEVICE_ID,
  pushToken: TEST_PUSH_TOKEN,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const TEST_REGISTRATION_DATA = {
  deviceLibraryIdentifier: TEST_DEVICE_ID,
  passTypeIdentifier: TEST_PASS_TYPE,
  serialNumber: TEST_SERIAL,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Admin auth constants
export const TEST_ADMIN_USER = 'testadmin';
export const TEST_ADMIN_PASS = 'testpass123';
export const TEST_ADMIN_AUTH_HEADER = `Basic ${btoa(`${TEST_ADMIN_USER}:${TEST_ADMIN_PASS}`)}`;

// Factory function to create fresh test pass content data (prevents test interference)
export function createTestPassContentData() {
  return {
    id: `test-content-${Date.now()}`,
    description: 'Test Event Ticket',
    organizationName: 'Test Organization',
    logoText: 'Test Event',
    eventName: 'Smoke Test Event',
    venueName: 'Test Venue',
    eventDateISO: '2025-06-01T19:30:00Z',
    seat: '12A',
    section: 'Test',
    barcode: {
      message: '1276451828321',
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
    },
    posterVersion: 1,
    semanticTags: {
      eventType: 'concert',
      priceCategory: 'premium',
      ageRestriction: 18,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Factory function to create fresh test pass row (prevents test interference)
export function createTestPassRow() {
  const contentId = `test-content-${Date.now()}`;
  return {
    // Core database fields (DatabasePassRow)
    serialNumber: `TEST-${Date.now()}`,
    passTypeIdentifier: TEST_PASS_TYPE,
    authenticationToken: `test-auth-${Date.now()}`,
    ticketStyle: 'event' as const,
    poster: false,
    passContentId: contentId, // FK to pass content
    etag: null,
    createdAt: new Date(),
    updatedAt: new Date(),

    // For testing scenarios that need the joined data
    passContent: createTestPassContentData(),

    // Optional testing fields
    id: `mock-${Date.now()}`,
    tenantId: 'test-tenant',
  };
}

// Combined data structure for tests that need both pass metadata and content
export function createTestPassWithContent() {
  const passContent = createTestPassContentData();
  return {
    pass: {
      serialNumber: `TEST-${Date.now()}`,
      passTypeIdentifier: TEST_PASS_TYPE,
      authenticationToken: `test-auth-${Date.now()}`,
      ticketStyle: 'event' as const,
      poster: false,
      passContentId: passContent.id,
      etag: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    passContent,
  };
}

// Mock PassRow data (complete mock matching database schema + PassRow interface)
// NOTE: For test isolation, prefer using createTestPassRow() instead of this shared constant
export const TEST_PASS_ROW = createTestPassRow();
