import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { randomBytes } from 'node:crypto';

// ---------------------------------------------------------------------------
// We need to control the ENCRYPTION_KEY env var for tests.
// Generate a valid 32-byte (64 hex char) key for testing.
// ---------------------------------------------------------------------------
const TEST_KEY = randomBytes(32).toString('hex');

describe('encryption', () => {
  let encrypt: typeof import('./encryption').encrypt;
  let decrypt: typeof import('./encryption').decrypt;
  let encryptIfPresent: typeof import('./encryption').encryptIfPresent;
  let decryptIfPresent: typeof import('./encryption').decryptIfPresent;

  beforeEach(async () => {
    // Set the encryption key before importing the module
    process.env.ENCRYPTION_KEY = TEST_KEY;
    // Re-import to pick up the env var
    const mod = await import('./encryption');
    encrypt = mod.encrypt;
    decrypt = mod.decrypt;
    encryptIfPresent = mod.encryptIfPresent;
    decryptIfPresent = mod.decryptIfPresent;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // encrypt / decrypt round-trip
  // -----------------------------------------------------------------------
  describe('encrypt and decrypt', () => {
    it('should round-trip a simple string', () => {
      const plaintext = 'hello world';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should round-trip an empty string', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should round-trip a long string', () => {
      const plaintext = 'a'.repeat(10000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should round-trip special characters', () => {
      const plaintext = '🔑 API key: sk_test_abc123!@#$%^&*()';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for the same plaintext (random IV)', () => {
      const plaintext = 'same input';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      expect(encrypted1).not.toBe(encrypted2);
      // But both should decrypt to the same value
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });

    it('should produce output in iv:authTag:ciphertext format', () => {
      const encrypted = encrypt('test');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      // Each part should be valid base64
      for (const part of parts) {
        expect(() => Buffer.from(part, 'base64')).not.toThrow();
      }
    });
  });

  // -----------------------------------------------------------------------
  // decrypt error handling
  // -----------------------------------------------------------------------
  describe('decrypt error handling', () => {
    it('should throw on invalid format (missing parts)', () => {
      expect(() => decrypt('invalid')).toThrow('Invalid encrypted data format');
    });

    it('should throw on invalid format (too many parts)', () => {
      expect(() => decrypt('a:b:c:d')).toThrow('Invalid encrypted data format');
    });

    it('should throw on tampered ciphertext', () => {
      const encrypted = encrypt('secret');
      const parts = encrypted.split(':');
      // Tamper with the ciphertext
      parts[2] = Buffer.from('tampered').toString('base64');
      expect(() => decrypt(parts.join(':'))).toThrow();
    });

    it('should throw on tampered auth tag', () => {
      const encrypted = encrypt('secret');
      const parts = encrypted.split(':');
      // Tamper with the auth tag
      parts[1] = Buffer.from('0000000000000000').toString('base64');
      expect(() => decrypt(parts.join(':'))).toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // Missing / invalid ENCRYPTION_KEY
  // -----------------------------------------------------------------------
  describe('ENCRYPTION_KEY validation', () => {
    it('should throw when ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is not set');
    });

    it('should throw when ENCRYPTION_KEY is wrong length', () => {
      process.env.ENCRYPTION_KEY = 'abcd'; // too short
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    });
  });

  // -----------------------------------------------------------------------
  // encryptIfPresent / decryptIfPresent
  // -----------------------------------------------------------------------
  describe('encryptIfPresent', () => {
    it('should return null for null input', () => {
      expect(encryptIfPresent(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(encryptIfPresent(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(encryptIfPresent('')).toBeNull();
    });

    it('should encrypt non-empty string', () => {
      const result = encryptIfPresent('secret');
      expect(result).not.toBeNull();
      expect(result).toContain(':'); // iv:authTag:ciphertext format
      expect(decrypt(result!)).toBe('secret');
    });
  });

  describe('decryptIfPresent', () => {
    it('should return null for null input', () => {
      expect(decryptIfPresent(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(decryptIfPresent(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(decryptIfPresent('')).toBeNull();
    });

    it('should decrypt non-empty encrypted string', () => {
      const encrypted = encrypt('my-api-key');
      const result = decryptIfPresent(encrypted);
      expect(result).toBe('my-api-key');
    });
  });
});
