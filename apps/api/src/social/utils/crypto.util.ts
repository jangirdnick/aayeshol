import * as crypto from 'node:crypto';

/** Symmetric encryption algorithm: AES-256 in Galois/Counter Mode (authenticated encryption) */
const ALGORITHM = 'aes-256-gcm';
/** Initialization vector size in bytes (12 bytes is standard for GCM) */
const IV_LENGTH = 12;

/**
 * Derives a 32-byte (256-bit) encryption key from an arbitrary string using SHA-256.
 *
 * @param secret - Raw secret string (e.g. JWT secret or dedicated ENCRYPTION_KEY).
 * @returns 32-byte cryptographic Buffer.
 */
export function deriveEncryptionKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

/**
 * Encrypts sensitive plaintext strings (OAuth access and refresh tokens) using AES-256-GCM.
 *
 * The output string encodes the initialization vector (IV), the 16-byte authentication tag,
 * and the encrypted ciphertext, separated by colons.
 *
 * @param plaintext - The raw token string to encrypt.
 * @param key - 32-byte cryptographic key.
 * @returns Serialized encrypted payload string in format `<iv_hex>:<authTag_hex>:<ciphertext_hex>`.
 *
 * @example
 * ```typescript
 * const encrypted = encryptToken('ya29.a0AfH6SM...', key);
 * // Output: '4a1b...:9c2e...:8f0a...'
 * ```
 */
export function encryptToken(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string back to plaintext.
 *
 * Validates the authentication tag to ensure the ciphertext has not been tampered with.
 *
 * @param encryptedData - Serialized string in format `<iv_hex>:<authTag_hex>:<ciphertext_hex>`.
 * @param key - 32-byte cryptographic key.
 * @returns Decrypted plaintext string.
 * @throws {Error} If payload is malformed or authentication tag verification fails.
 *
 * @example
 * ```typescript
 * const token = decryptToken('4a1b...:9c2e...:8f0a...', key);
 * ```
 */
export function decryptToken(encryptedData: string, key: Buffer): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted token format. Expected iv:authTag:ciphertext');
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
