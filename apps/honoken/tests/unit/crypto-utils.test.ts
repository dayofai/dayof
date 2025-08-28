import { describe, it, expect } from 'vitest';
import { sha256, truncateMiddle } from '../../src/utils/crypto';

describe('Crypto Utils', () => {
  describe('sha256', () => {
    it('should hash strings consistently with sha256', async () => {
      const input = 'test-serial-123';
      const result = await sha256(input);
      
      // SHA-256 should always produce the same hash for the same input
      expect(result).toBe('0c8e71fd6a6139b51d59614f15a648f5475b7383d12e1ab41e94abe1ff97db63');
      expect(result).toHaveLength(64); // SHA-256 hex length
      expect(result).toMatch(/^[a-f0-9]{64}$/); // Only hex characters
    });

    it('should produce different hashes for different inputs', async () => {
      const hash1 = await sha256('serial-123');
      const hash2 = await sha256('serial-456');
      
      expect(hash1).not.toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash2).toHaveLength(64);
    });

    it('should handle empty strings', async () => {
      const result = await sha256('');
      expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      expect(result).toHaveLength(64);
    });

    it('should handle unicode characters', async () => {
      const result = await sha256('🔑test-key-🎫');
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('truncateMiddle', () => {
    it('should truncate long strings in the middle', () => {
      const longString = 'a'.repeat(100);
      const result = truncateMiddle(longString, 20);
      
      expect(result).toContain('...');
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result.startsWith('a')).toBe(true);
      expect(result.endsWith('a')).toBe(true);
    });

    it('should return original string if shorter than max length', () => {
      const shortString = 'short';
      const result = truncateMiddle(shortString, 20);
      
      expect(result).toBe(shortString);
      expect(result).not.toContain('...');
    });

    it('should return original string if equal to max length', () => {
      const exactString = 'exactly20characters!';
      const result = truncateMiddle(exactString, 20);
      
      expect(result).toBe(exactString);
      expect(result).not.toContain('...');
    });

    it('should handle very small max lengths', () => {
      const longString = 'verylongstring';
      const result = truncateMiddle(longString, 5);
      
      expect(result.length).toBeLessThanOrEqual(5);
      expect(result).toContain('...');
    });

    it('should handle edge case of max length 3 (just ellipsis)', () => {
      const longString = 'verylongstring';
      const result = truncateMiddle(longString, 3);
      
      expect(result.length).toBeLessThanOrEqual(3);
      expect(result).toContain('...');
    });

    it('should preserve start and end characters when possible', () => {
      const testString = 'start_middle_content_end';
      const result = truncateMiddle(testString, 15);
      
      expect(result).toContain('...');
      expect(result.startsWith('start')).toBe(true);
      expect(result.endsWith('end')).toBe(true);
      expect(result.length).toBeLessThanOrEqual(15);
    });
  });
});