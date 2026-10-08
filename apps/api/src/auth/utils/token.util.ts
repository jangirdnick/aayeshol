import * as crypto from 'node:crypto';

/**
 * Generates a cryptographically secure, high-entropy refresh token.
 * Returns a URL-safe base64 string.
 *
 * @returns 64-byte random token as base64url string
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('base64url');
}

/**
 * Hashes a high-entropy refresh token using SHA-256.
 * SHA-256 is appropriate here because refresh tokens are high-entropy random bytes;
 * bcrypt is reserved for user passwords.
 *
 * @param token - Raw refresh token string
 * @returns Hex-encoded SHA-256 hash
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a unique session/device identifier using crypto.randomUUID.
 *
 * @returns UUID v4 string
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Cookie name constant for the refresh token.
 */
export const REFRESH_TOKEN_COOKIE = 'aayeshol_rt';

/**
 * Returns the standard secure cookie options for the refresh token.
 * Adjusts security flags based on NODE_ENV.
 *
 * @param maxAgeMs - Cookie max-age in milliseconds
 * @param isProduction - Whether to apply secure/sameSite=none flags
 */
export function getRefreshTokenCookieOptions(
  maxAgeMs: number,
  isProduction: boolean,
): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAge: number;
  path: string;
} {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  };
}
