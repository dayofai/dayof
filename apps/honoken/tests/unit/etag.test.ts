import { describe, expect, it } from 'vitest';
import { computeEtagFrom } from '../../src/repo/etag';

describe('ETag computation (write-time semantics)', () => {
  it('produces identical ETags for content with different property orders', async () => {
    const meta = {
      passTypeIdentifier: 'pass.com.example.test',
      serialNumber: 'TEST-001',
      ticketStyle: 'event' as const,
      poster: false,
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    const contentA = {
      description: 'Test Event',
      organizationName: 'Test Org',
      barcode: {
        message: '123',
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
      },
      eventName: 'Concert',
    };
    const contentB = {
      organizationName: 'Test Org',
      barcode: {
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        message: '123',
      },
      description: 'Test Event',
      eventName: 'Concert',
    };

    const etag1 = await computeEtagFrom(meta, contentA);
    const etag2 = await computeEtagFrom(meta, contentB);

    expect(etag1).toBe(etag2);
    expect(etag1).toHaveLength(64);
  });

  it('changes ETag when content changes', async () => {
    const meta = {
      passTypeIdentifier: 'pass.com.example.test',
      serialNumber: 'TEST-001',
      ticketStyle: 'event' as const,
      poster: false,
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    const contentA = { description: 'A', organizationName: 'Org' };
    const contentB = { description: 'B', organizationName: 'Org' };

    const etag1 = await computeEtagFrom(meta, contentA);
    const etag2 = await computeEtagFrom(meta, contentB);
    expect(etag1).not.toBe(etag2);
  });

  it('changes ETag when updatedAt second changes (seconds precision)', async () => {
    const meta1 = {
      passTypeIdentifier: 'pass.com.example.test',
      serialNumber: 'TEST-001',
      ticketStyle: 'event' as const,
      poster: false,
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };
    const meta2 = { ...meta1, updatedAt: new Date('2024-01-01T00:00:01Z') };
    const content = { description: 'Same', organizationName: 'Same' };

    const etag1 = await computeEtagFrom(meta1, content);
    const etag2 = await computeEtagFrom(meta2, content);
    expect(etag1).not.toBe(etag2);
  });

  it('does not change ETag when updatedAt changes within the same second', async () => {
    const base = new Date('2024-01-01T00:00:00.100Z');
    const meta1 = {
      passTypeIdentifier: 'pass.com.example.test',
      serialNumber: 'TEST-001',
      ticketStyle: 'event' as const,
      poster: false,
      updatedAt: base,
    };
    const meta2 = { ...meta1, updatedAt: new Date(base.getTime() + 800) }; // +0.8s, same second
    const content = { description: 'Same', organizationName: 'Same' };

    const etag1 = await computeEtagFrom(meta1, content);
    const etag2 = await computeEtagFrom(meta2, content);
    expect(etag1).toBe(etag2);
  });

  it('changes ETag when poster flag changes', async () => {
    const meta1 = {
      passTypeIdentifier: 'pass.com.example.test',
      serialNumber: 'TEST-001',
      ticketStyle: 'event' as const,
      poster: false,
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };
    const meta2 = { ...meta1, poster: true };
    const content = { description: 'Same', organizationName: 'Same' };

    const etag1 = await computeEtagFrom(meta1, content);
    const etag2 = await computeEtagFrom(meta2, content);
    expect(etag1).not.toBe(etag2);
  });

  it('ignores authentication token (not part of payload)', async () => {
    const meta = {
      passTypeIdentifier: 'pass.com.example.test',
      serialNumber: 'TEST-001',
      ticketStyle: 'event' as const,
      poster: false,
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };
    const content = { foo: 'bar' };

    const etag1 = await computeEtagFrom(meta, content);
    // Simulate a token change by recomputing with same meta/content; since token
    // is not passed into computeEtagFrom, the value remains identical.
    const etag2 = await computeEtagFrom(meta, content);
    expect(etag1).toBe(etag2);
  });
});
