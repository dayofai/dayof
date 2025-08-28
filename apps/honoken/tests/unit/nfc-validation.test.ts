import { describe, it, expect } from 'vitest';
import { PassDataEventTicketSchema } from '../../src/schemas';
import { z } from 'zod/v4';

describe('NFC Validation', () => {
  const basePassData = {
    description: "Test Event",
    organizationName: "Test Org",
    eventTicket: {
      primaryFields: [
        {
          key: "event",
          label: "Event",
          value: "Test Concert"
        }
      ]
    }
  };

  describe('Valid NFC configurations', () => {
    it('should accept pass data without NFC object', () => {
      expect(() => PassDataEventTicketSchema.parse(basePassData)).not.toThrow();
    });

    it('should accept valid NFC with proper encryptionPublicKey', () => {
      const validNfcData = {
        ...basePassData,
        nfc: {
          message: "test-serial-123",
          encryptionPublicKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEAnXgOhFILzOZFzPOUWa1dH2V8cI1dOw0YYPJ+sV8A8CpL5qJ9gK7dF2V8cI1dOw0YYPJ+sV8A8CpL5qJ9gK7dF2V"
        }
      };
      
      expect(() => PassDataEventTicketSchema.parse(validNfcData)).not.toThrow();
    });

    it('should accept different valid Base64 key formats', () => {
      const validKeys = [
        "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEAnXgOhFILzOZFzPOUWa1dH2V8cI1dOw0YYPJ+sV8A8CpL5qJ9gK7",
        "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEAnXgOhFILzOZFzPOUWa1dH2V8cI1dOw0YYPJ+sV8A8CpL5qJ9gK7dF2V8cI1dOw0YYPJ+sV8A8CpL5qJ9gK7dF2V8cI1dOw=",
        "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEAnXgOhFILzOZFzPOUWa1dH2V8cI1dOw0YYPJ+sV8A8CpL5qJ9gK7dF2V8cI1dOw0YYPJ+sV8A8CpL5qJ9gK7dF2V8cI1dOw=="
      ];

      validKeys.forEach(key => {
        const nfcData = {
          ...basePassData,
          nfc: {
            message: "test-serial-123",
            encryptionPublicKey: key
          }
        };
        
        expect(() => PassDataEventTicketSchema.parse(nfcData)).not.toThrow();
      });
    });
  });

  describe('Invalid NFC configurations that should be rejected', () => {
    it('should reject empty encryptionPublicKey', () => {
      const invalidNfcData = {
        ...basePassData,
        nfc: {
          message: "test-serial-123",
          encryptionPublicKey: ""
        }
      };
      
      expect(() => PassDataEventTicketSchema.parse(invalidNfcData)).toThrow(/cannot be empty/);
    });

    it('should reject whitespace-only encryptionPublicKey', () => {
      const invalidNfcData = {
        ...basePassData,
        nfc: {
          message: "test-serial-123",
          encryptionPublicKey: "   "
        }
      };
      
      expect(() => PassDataEventTicketSchema.parse(invalidNfcData)).toThrow(/must be a valid Base64-encoded string/);
    });

    it('should reject invalid Base64 characters', () => {
      const invalidKeys = [
        "invalid-characters!@#$%",
        "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE<invalid>",
        "not-base64-at-all"
      ];

      invalidKeys.forEach(key => {
        const invalidNfcData = {
          ...basePassData,
          nfc: {
            message: "test-serial-123",
            encryptionPublicKey: key
          }
        };
        
        expect(() => PassDataEventTicketSchema.parse(invalidNfcData)).toThrow(/must be a valid Base64-encoded string/);
      });
    });

    it('should reject keys that are too short', () => {
      const tooShortKey = "MFkwEw"; // Only 6 characters, way too short for ECDH P-256
      const invalidNfcData = {
        ...basePassData,
        nfc: {
          message: "test-serial-123",
          encryptionPublicKey: tooShortKey
        }
      };
      
      expect(() => PassDataEventTicketSchema.parse(invalidNfcData)).toThrow(/invalid length for ECDH P-256/);
    });

    it('should reject keys that are too long', () => {
      const tooLongKey = "A".repeat(300); // Way too long for any reasonable key
      const invalidNfcData = {
        ...basePassData,
        nfc: {
          message: "test-serial-123",
          encryptionPublicKey: tooLongKey
        }
      };
      
      expect(() => PassDataEventTicketSchema.parse(invalidNfcData)).toThrow(/invalid length for ECDH P-256/);
    });

    it('should reject NFC with empty message', () => {
      const invalidNfcData = {
        ...basePassData,
        nfc: {
          message: "",
          encryptionPublicKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEAnXgOhFILzOZFzPOUWa1dH2V8cI1dOw0YYPJ+sV8A8CpL5qJ9gK7"
        }
      };
      
      expect(() => PassDataEventTicketSchema.parse(invalidNfcData)).toThrow(/NFC message cannot be empty/);
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined nfc gracefully', () => {
      const passDataWithUndefinedNfc = {
        ...basePassData,
        nfc: undefined
      };
      
      expect(() => PassDataEventTicketSchema.parse(passDataWithUndefinedNfc)).not.toThrow();
    });

    it('should validate all required fields when NFC is present', () => {
      const incompleteNfc = {
        ...basePassData,
        nfc: {
          encryptionPublicKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEAnXgOhFILzOZFzPOUWa1dH2V8cI1dOw0YYPJ+sV8A8CpL5qJ9gK7"
          // Missing message field
        }
      };
      
      expect(() => PassDataEventTicketSchema.parse(incompleteNfc)).toThrow();
    });
  });
}); 