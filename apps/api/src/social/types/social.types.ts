import type { Platform } from '../../generated/prisma/client.js';

/**
 * Metadata stored in Redis for an active OAuth authorization transaction.
 * Binds the temporary OAuth state parameter to the initiating authenticated Aayeshol user.
 */
export interface OAuthStateData {
  /** Cryptographically generated random UUID */
  state: string;
  /** Authenticated user ID in Aayeshol initiating the account connection */
  userId: string;
  /** Target social media platform */
  platform: Platform;
  /** Active session ID of the user (for telemetry/audit) */
  sessionId?: string;
  /** Epoch timestamp in milliseconds when state was created */
  createdAt: number;
}

/**
 * Normalized profile and token data extracted from a third-party OAuth provider.
 * Produced by Passport strategies upon successful authorization callback.
 */
export interface SocialAuthProfile {
  /** Target platform enum from Prisma */
  provider: Platform;
  /** Unique platform-specific account identifier (e.g., Google sub, LinkedIn member ID, Twitter user ID) */
  providerId: string;
  /** User or channel display name returned by the provider */
  name?: string;
  /** Email address associated with the provider account (if granted/available) */
  email?: string;
  /** Public profile avatar image URL */
  avatar?: string;
  /** Plaintext OAuth access token (will be AES-encrypted before DB persistence) */
  accessToken: string;
  /** Optional plaintext OAuth refresh token (will be AES-encrypted before DB persistence) */
  refreshToken?: string;
  /** Token expiry date derived from expires_in */
  tokenExpiry?: Date;
  /** List of granted scope strings */
  grantedScopes?: string[];
}

/**
 * Public response contract for connected social accounts returned to the frontend.
 * Sensitive tokens are strictly omitted for security.
 */
export interface ConnectedAccountResponse {
  id: string;
  provider: Platform;
  providerId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
  hasRefreshToken: boolean;
  tokenExpiresAt: Date | null;
}
