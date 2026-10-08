import * as crypto from 'node:crypto';

/**
 * Generates a cryptographically secure numeric OTP of the specified length.
 *
 * @param length - Desired OTP length (default: 6)
 * @returns A zero-padded numeric OTP string
 *
 * @example
 * const otp = generateOtp(); // '837291'
 */
export function generateOtp(length = 6): string {
  const max = Math.pow(10, length);
  // Bias-free random number in [0, max)
  const random = crypto.randomInt(0, max);
  return random.toString().padStart(length, '0');
}

/**
 * Hashes an OTP or other short secret using SHA-256.
 * SHA-256 is appropriate for high-entropy tokens; bcrypt is used for passwords.
 *
 * @param otp - The plaintext OTP to hash
 * @returns Hex-encoded SHA-256 hash of the OTP
 */
export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Safely compares a submitted OTP with its stored SHA-256 hash using timing-safe comparison.
 *
 * @param submitted - Plaintext OTP submitted by the user
 * @param storedHash - Previously stored SHA-256 hash of the OTP
 * @returns True if the OTP matches the stored hash
 */
export function verifyOtpHash(submitted: string, storedHash: string): boolean {
  const submittedHash = hashOtp(submitted);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(submittedHash, 'hex'),
      Buffer.from(storedHash, 'hex'),
    );
  } catch {
    return false;
  }
}
