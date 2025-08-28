import { describe, it, expect } from 'vitest';
import { computeEtag } from '../../src/db/etag';
import type { PassRow } from '../../src/types';

describe('ETag computation', () => {
  it('should produce identical ETags for PassRow objects with different property orders', async () => {
    // Create two PassRow objects with same content but different property orders
    const passRow1: PassRow = {
      serialNumber: "TEST-001",
      passTypeIdentifier: "pass.com.example.test",
      authenticationToken: "token123",
      ticketStyle: "event",
      poster: false,
      etag: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      passData: {
        description: "Test Event",
        organizationName: "Test Org",
        barcode: { message: "123", format: "PKBarcodeFormatQR", messageEncoding: "iso-8859-1" },
        eventName: "Concert"
      }
    };

    const passRow2: PassRow = {
      passTypeIdentifier: "pass.com.example.test", // Different order
      ticketStyle: "event",
      serialNumber: "TEST-001",
      poster: false,
      authenticationToken: "token123",
      etag: null,
      updatedAt: new Date('2024-01-01T00:00:00Z'), // Different order
      createdAt: new Date('2024-01-01T00:00:00Z'),
      passData: {
        organizationName: "Test Org", // Different order
        barcode: { format: "PKBarcodeFormatQR", messageEncoding: "iso-8859-1", message: "123" }, // Different order
        description: "Test Event",
        eventName: "Concert"
      }
    };

    const etag1 = await computeEtag(passRow1);
    const etag2 = await computeEtag(passRow2);

    expect(etag1).toBe(etag2);
    expect(etag1).toHaveLength(64); // SHA-256 produces 64 hex characters
  });

  it('should produce different ETags for PassRow objects with different content', async () => {
    const basePassRow: PassRow = {
      serialNumber: "TEST-001",
      passTypeIdentifier: "pass.com.example.test",
      authenticationToken: "token123",
      ticketStyle: "event",
      poster: false,
      etag: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      passData: {
        description: "Test Event",
        organizationName: "Test Org"
      }
    };

    const modifiedPassRow: PassRow = {
      ...basePassRow,
      passData: {
        description: "Modified Event", // Changed content
        organizationName: "Test Org"
      }
    };

    const etag1 = await computeEtag(basePassRow);
    const etag2 = await computeEtag(modifiedPassRow);

    expect(etag1).not.toBe(etag2);
  });

  it('should exclude volatile fields from ETag computation', async () => {
    const passRow1: PassRow = {
      serialNumber: "TEST-001",
      passTypeIdentifier: "pass.com.example.test",
      authenticationToken: "token123",
      ticketStyle: "event",
      poster: false,
      etag: "old-etag-value",
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      passData: { description: "Test", organizationName: "Test Org" }
    };

    const passRow2: PassRow = {
      ...passRow1,
      etag: "different-etag-value",
      createdAt: new Date('2024-06-01T00:00:00Z'), // Different timestamp
      updatedAt: new Date('2024-06-01T00:00:00Z')  // Different timestamp
    };

    const etag1 = await computeEtag(passRow1);
    const etag2 = await computeEtag(passRow2);

    // ETags should be identical because volatile fields (etag, createdAt, updatedAt) are excluded
    expect(etag1).toBe(etag2);
  });

  it('should handle deeply nested objects consistently', async () => {
    const passRow1: PassRow = {
      serialNumber: "TEST-001",
      passTypeIdentifier: "pass.com.example.test",
      authenticationToken: "token123",
      ticketStyle: "event",
      poster: false,
      etag: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      passData: {
        description: "Test Event",
        organizationName: "Test Org",
        barcode: {
          message: "123456789",
          format: "PKBarcodeFormatQR",
          messageEncoding: "iso-8859-1"
        },
        eventInfo: {
          venue: { name: "Test Venue", address: "123 Test St" },
          datetime: "2024-06-01T19:30:00Z"
        }
      }
    };

    const passRow2: PassRow = {
      serialNumber: "TEST-001",
      passTypeIdentifier: "pass.com.example.test",
      authenticationToken: "token123",
      ticketStyle: "event",
      poster: false,
      etag: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      passData: {
        organizationName: "Test Org", // Different order
        eventInfo: {
          datetime: "2024-06-01T19:30:00Z", // Different order
          venue: { address: "123 Test St", name: "Test Venue" } // Different order
        },
        description: "Test Event",
        barcode: {
          format: "PKBarcodeFormatQR", // Different order
          messageEncoding: "iso-8859-1",
          message: "123456789"
        }
      }
    };

    const etag1 = await computeEtag(passRow1);
    const etag2 = await computeEtag(passRow2);

    expect(etag1).toBe(etag2);
  });
}); 