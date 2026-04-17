import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
// Use 12-byte (96-bit) IV as recommended by NIST SP 800-38D for AES-GCM
const IV_LENGTH = 12;

// Cache the parsed encryption key to avoid re-parsing the hex env var on every call.
// Tracks the raw env value so the cache auto-invalidates if the env var changes.
let _cachedKey: Buffer | null = null;
let _cachedKeySource: string | undefined = undefined;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (_cachedKey && key === _cachedKeySource) return _cachedKey;

  if (!key) {
    _cachedKey = null;
    _cachedKeySource = undefined;
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    _cachedKey = null;
    _cachedKeySource = undefined;
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  _cachedKey = keyBuffer;
  _cachedKeySource = key;
  return keyBuffer;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string in the format: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all base64-encoded)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string produced by encrypt().
 * Expects the format: iv:authTag:ciphertext (all base64-encoded)
 */
export function decrypt(encrypted: string): string {
  const key = getEncryptionKey();
  const parts = encrypted.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const ciphertext = parts[2];

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt a value if it's not null/undefined, otherwise return null.
 */
export function encryptIfPresent(value: string | null | undefined): string | null {
  if (value == null || value.trim() === '') return null;
  return encrypt(value);
}

/**
 * Decrypt a value if it's not null/undefined, otherwise return null.
 */
export function decryptIfPresent(value: string | null | undefined): string | null {
  if (value == null || value.trim() === '') return null;
  return decrypt(value);
}
