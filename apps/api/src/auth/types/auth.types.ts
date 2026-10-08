export type { SafeUser } from '@aayeshol/types';

/**
 * JWT Access Token payload claims.
 */
export interface JwtAccessPayload {
  /** Subject — user ID */
  sub: string;
  /** Session ID for revocation checks */
  sessionId: string;
  /** Token purpose discriminant */
  purpose: 'access';
}

/**
 * Validated JWT payload attached to req.user by JWT guard.
 */
export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
}

/**
 * Redis OTP challenge stored for login or password-reset flows.
 */
export interface OtpChallenge {
  /** Hashed OTP (SHA-256) */
  otpHash: string;
  /** Expiry timestamp (ms since epoch) */
  expiresAt: number;
  /** Number of failed verification attempts */
  attempts: number;
  /** Email of the user this challenge belongs to */
  email: string;
}

/**
 * Redis OTP challenge for email verification flow.
 */
export interface EmailVerificationChallenge {
  otpHash: string;
  expiresAt: number;
  attempts: number;
  userId: string;
  email: string;
}

/**
 * Successful login OTP initiation response data.
 */
export interface LoginChallengeResult {
  challengeId: string;
  message: string;
}

/**
 * Successful token pair issued after OTP verification.
 */
export interface TokenPair {
  accessToken: string;
  /** Used for cookie only — never returned to client directly */
  refreshToken: string;
  sessionId: string;
}
