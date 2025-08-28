/**
 * Simple test for image dimension verification
 * 
 * This file is for testing purposes only and can be run with:
 * ts-node image-validator-test.ts
 */

import { describe, it, expect } from 'vitest';
// Import the verifyImageDimensions function from the source
// Since this is a direct implementation in the passkit.ts file, we'll recreate it here for testing
// We'll also need this function to recreate/test the PNG verification logic

/**
 * Creates a minimal valid PNG buffer with specified dimensions
 * @param width Image width in pixels
 * @param height Image height in pixels
 * @returns Uint8Array containing a minimal PNG header
 */
function createTestPng(width: number, height: number): Uint8Array {
  // Create a buffer with a valid PNG signature and IHDR chunk
  const buffer = new Uint8Array(30);
  
  // PNG signature
  buffer[0] = 0x89;
  buffer[1] = 0x50;
  buffer[2] = 0x4E;
  buffer[3] = 0x47;
  buffer[4] = 0x0D;
  buffer[5] = 0x0A;
  buffer[6] = 0x1A;
  buffer[7] = 0x0A;
  
  // IHDR chunk length (13 bytes)
  buffer[8] = 0;
  buffer[9] = 0;
  buffer[10] = 0;
  buffer[11] = 13;
  
  // IHDR chunk name
  buffer[12] = 0x49; // I
  buffer[13] = 0x48; // H
  buffer[14] = 0x44; // D
  buffer[15] = 0x52; // R
  
  // Width (4 bytes, big-endian)
  buffer[16] = (width >> 24) & 0xFF;
  buffer[17] = (width >> 16) & 0xFF;
  buffer[18] = (width >> 8) & 0xFF;
  buffer[19] = width & 0xFF;
  
  // Height (4 bytes, big-endian)
  buffer[20] = (height >> 24) & 0xFF;
  buffer[21] = (height >> 16) & 0xFF;
  buffer[22] = (height >> 8) & 0xFF;
  buffer[23] = height & 0xFF;
  
  // Other required IHDR fields (bit depth, color type, etc.)
  buffer[24] = 8;  // Bit depth
  buffer[25] = 6;  // Color type (RGBA)
  buffer[26] = 0;  // Compression method
  buffer[27] = 0;  // Filter method
  buffer[28] = 0;  // Interlace method
  
  // We're not including the CRC for simplicity
  
  return buffer;
}

interface ImageDimensions {
  width: number;
  height: number;
}

function getImageDimensions(imageBuffer: ArrayBufferLike): ImageDimensions | null {
  const bytes = new Uint8Array(imageBuffer);

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    // PNG signature verified, now validate IHDR chunk
    
    // Need at least 24 bytes for PNG signature + chunk length + chunk type + width + height
    if (bytes.length < 24) {
      return null;
    }
    
    // Read chunk length (bytes 8-11, big-endian)
    const chunkLength = (bytes[8] << 24) | (bytes[9] << 16) | (bytes[10] << 8) | bytes[11];
    
    // IHDR chunk should be exactly 13 bytes
    if (chunkLength !== 13) {
      return null;
    }
    
    // Verify chunk type is "IHDR" (bytes 12-15)
    if (bytes[12] !== 0x49 || bytes[13] !== 0x48 || bytes[14] !== 0x44 || bytes[15] !== 0x52) {
      return null;
    }
    
    // Now it's safe to read width/height from bytes 16-23
    const dv = new DataView(bytes.buffer, bytes.byteOffset + 16, 8);
    return { width: dv.getUint32(0), height: dv.getUint32(4) };
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset < bytes.length - 1) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = bytes[offset + 1];
      if (marker >= 0xc0 && marker <= 0xc3) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        return { width, height };
      }

      if (offset + 4 >= bytes.length) {
        break;
      }
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += length + 2;
    }
  }

  return null;
}

function verifyImageDimensions(
  imageBuffer: ArrayBufferLike,
  expectedWidth: number,
  expectedHeight: number,
  imageName: string
): boolean {
  try {
    const dims = getImageDimensions(imageBuffer);
    if (dims) {
      if (dims.width !== expectedWidth || dims.height !== expectedHeight) {
        console.error(`${imageName} has incorrect dimensions: ${dims.width}x${dims.height}, expected: ${expectedWidth}x${expectedHeight}`);
        return false;
      }
      return true;
    }

    console.warn(`Could not verify dimensions for ${imageName}. Please ensure it is ${expectedWidth}x${expectedHeight} pixels.`);
    return true;
  } catch (error) {
    console.warn(`Error checking dimensions for ${imageName}: ${error}`);
    return true;
  }
}

describe('Pass Image Dimension Verification', () => {
  describe('PNG dimension detection', () => {
    it('should correctly identify PNG dimensions', () => {
      const png = createTestPng(100, 200);
      const bytes = new Uint8Array(png.buffer);
      
      // Check signature detection logic
      const isPng = 
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4E &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0D &&
        bytes[5] === 0x0A &&
        bytes[6] === 0x1A &&
        bytes[7] === 0x0A;
      
      expect(isPng).toBe(true);
      
      // Check dimension extraction logic
      const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
      const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
      
      expect(width).toBe(100);
      expect(height).toBe(200);
    });
  });

  describe('verifyImageDimensions function', () => {
    it('should accept icon.png with correct dimensions (29x29)', () => {
      const validIcon = createTestPng(29, 29);
      const result = verifyImageDimensions(validIcon.buffer, 29, 29, "icon.png");
      expect(result).toBe(true);
    });

    it('should reject icon.png with incorrect dimensions (30x30)', () => {
      const invalidIcon = createTestPng(30, 30);
      const result = verifyImageDimensions(invalidIcon.buffer, 29, 29, "icon.png");
      expect(result).toBe(false);
    });
    
    it('should accept icon@2x.png with correct dimensions (58x58)', () => {
      const validIcon2x = createTestPng(58, 58);
      const result = verifyImageDimensions(validIcon2x.buffer, 58, 58, "icon@2x.png");
      expect(result).toBe(true);
    });
    
    it('should reject icon@2x.png with incorrect dimensions (57x58)', () => {
      const invalidIcon2x = createTestPng(57, 58);
      const result = verifyImageDimensions(invalidIcon2x.buffer, 58, 58, "icon@2x.png");
      expect(result).toBe(false);
    });
    
    it('should accept logo.png with correct dimensions (160x50)', () => {
      const validLogo = createTestPng(160, 50);
      const result = verifyImageDimensions(validLogo.buffer, 160, 50, "logo.png");
      expect(result).toBe(true);
    });
  });
  
  describe('Apple Wallet image dimension requirements', () => {
    it('should enforce required dimensions for icon.png (29x29)', () => {
      const icon = createTestPng(29, 29);
      expect(verifyImageDimensions(icon.buffer, 29, 29, "icon.png")).toBe(true);
      
      const wrongIcon1 = createTestPng(28, 29);
      expect(verifyImageDimensions(wrongIcon1.buffer, 29, 29, "icon.png")).toBe(false);
      
      const wrongIcon2 = createTestPng(29, 28);
      expect(verifyImageDimensions(wrongIcon2.buffer, 29, 29, "icon.png")).toBe(false);
    });
    
    it('should enforce required dimensions for icon@2x.png (58x58)', () => {
      const icon2x = createTestPng(58, 58);
      expect(verifyImageDimensions(icon2x.buffer, 58, 58, "icon@2x.png")).toBe(true);
      
      const wrongIcon2x = createTestPng(58, 57);
      expect(verifyImageDimensions(wrongIcon2x.buffer, 58, 58, "icon@2x.png")).toBe(false);
    });
    
    it('should enforce required dimensions for icon@3x.png (87x87)', () => {
      const icon3x = createTestPng(87, 87);
      expect(verifyImageDimensions(icon3x.buffer, 87, 87, "icon@3x.png")).toBe(true);
      
      const wrongIcon3x = createTestPng(88, 87);
      expect(verifyImageDimensions(wrongIcon3x.buffer, 87, 87, "icon@3x.png")).toBe(false);
    });
    
    it('should enforce required dimensions for logo.png (160x50)', () => {
      const logo = createTestPng(160, 50);
      expect(verifyImageDimensions(logo.buffer, 160, 50, "logo.png")).toBe(true);
      
      const wrongLogo = createTestPng(160, 51);
      expect(verifyImageDimensions(wrongLogo.buffer, 160, 50, "logo.png")).toBe(false);
    });
    
    it('should enforce required dimensions for logo@2x.png (320x100)', () => {
      const logo2x = createTestPng(320, 100);
      expect(verifyImageDimensions(logo2x.buffer, 320, 100, "logo@2x.png")).toBe(true);
      
      const wrongLogo2x = createTestPng(319, 100);
      expect(verifyImageDimensions(wrongLogo2x.buffer, 320, 100, "logo@2x.png")).toBe(false);
    });
  });

  describe('PNG security vulnerabilities', () => {
    it('should reject malicious PNG with signature but no IHDR chunk', () => {
      // Create a malicious 32-byte file with PNG signature but no valid IHDR
      const maliciousPng = new Uint8Array(32);
      
      // Valid PNG signature
      maliciousPng[0] = 0x89;
      maliciousPng[1] = 0x50;
      maliciousPng[2] = 0x4E;
      maliciousPng[3] = 0x47;
      maliciousPng[4] = 0x0D;
      maliciousPng[5] = 0x0A;
      maliciousPng[6] = 0x1A;
      maliciousPng[7] = 0x0A;
      
      // Garbage data instead of proper IHDR chunk
      // This doesn't have a proper chunk length or IHDR chunk type
      for (let i = 8; i < 32; i++) {
        maliciousPng[i] = 0xFF; // Fill with garbage
      }
      
      // After fixing the vulnerability, this should return null
      const result = getImageDimensions(maliciousPng.buffer);
      expect(result).toBe(null);
    });
    
    it('should reject PNG with invalid IHDR chunk type', () => {
      const invalidPng = new Uint8Array(32);
      
      // Valid PNG signature
      invalidPng[0] = 0x89; invalidPng[1] = 0x50; invalidPng[2] = 0x4E; invalidPng[3] = 0x47;
      invalidPng[4] = 0x0D; invalidPng[5] = 0x0A; invalidPng[6] = 0x1A; invalidPng[7] = 0x0A;
      
      // Valid chunk length (13 bytes)
      invalidPng[8] = 0; invalidPng[9] = 0; invalidPng[10] = 0; invalidPng[11] = 13;
      
      // Invalid chunk type (should be "IHDR" but let's use "FAKE")
      invalidPng[12] = 0x46; // F
      invalidPng[13] = 0x41; // A  
      invalidPng[14] = 0x4B; // K
      invalidPng[15] = 0x45; // E
      
      // Valid-looking width/height
      invalidPng[16] = 0; invalidPng[17] = 0; invalidPng[18] = 0; invalidPng[19] = 100; // width = 100
      invalidPng[20] = 0; invalidPng[21] = 0; invalidPng[22] = 0; invalidPng[23] = 200; // height = 200
      
      const result = getImageDimensions(invalidPng.buffer);
      
      // This should return null because the chunk type is not "IHDR"
      expect(result).toBe(null);
    });
    
    it('should reject PNG with invalid IHDR chunk length', () => {
      const invalidPng = new Uint8Array(32);
      
      // Valid PNG signature
      invalidPng[0] = 0x89; invalidPng[1] = 0x50; invalidPng[2] = 0x4E; invalidPng[3] = 0x47;
      invalidPng[4] = 0x0D; invalidPng[5] = 0x0A; invalidPng[6] = 0x1A; invalidPng[7] = 0x0A;
      
      // Invalid chunk length (14 bytes instead of 13)
      invalidPng[8] = 0; invalidPng[9] = 0; invalidPng[10] = 0; invalidPng[11] = 14;
      
      // Valid IHDR chunk type
      invalidPng[12] = 0x49; // I
      invalidPng[13] = 0x48; // H
      invalidPng[14] = 0x44; // D
      invalidPng[15] = 0x52; // R
      
      // Valid-looking width/height
      invalidPng[16] = 0; invalidPng[17] = 0; invalidPng[18] = 0; invalidPng[19] = 100; // width = 100
      invalidPng[20] = 0; invalidPng[21] = 0; invalidPng[22] = 0; invalidPng[23] = 200; // height = 200
      
      const result = getImageDimensions(invalidPng.buffer);
      
      // This should return null because the chunk length is not 13
      expect(result).toBe(null);
    });
  });
}); 