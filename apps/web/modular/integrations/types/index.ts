import type { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from '@aayeshol/types';

export type SupportedPlatformId = 'LINKEDIN' | 'X_TWITTER' | 'INSTAGRAM' | 'YOUTUBE';

export type BackendPlatform = 'LINKEDIN' | 'X_TWITTER' | 'THREADS' | 'INSTAGRAM' | 'YOUTUBE';

/**
 * Public response contract for a connected social account returned from the backend (GET /api/social/accounts).
 * Sensitive OAuth tokens are strictly omitted by the backend for security.
 */
export interface ConnectedSocialAccount {
  id: string;
  provider: BackendPlatform;
  providerId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  hasRefreshToken: boolean;
  tokenExpiresAt: string | null;
}

/**
 * UI-level normalized model for a connected profile bound to a platform card.
 */
export interface ConnectedProfileData {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  avatar: string | null;
  profileUrl: string | null;
  connectedAt: string | Date;
  hasRefreshToken?: boolean;
  tokenExpiresAt?: string | null;
}

/**
 * Platform display metadata & active connection state.
 */
export interface SocialPlatformConfig {
  id: SupportedPlatformId;
  name: string;
  category: string;
  description: string;
  capabilities: string[];
  docsUrl?: string;
  account?: ConnectedProfileData | null;
  isConnecting?: boolean;
}

export type FilterStatus = 'ALL' | 'CONNECTED' | 'DISCONNECTED';

export type { ApiResponse, ApiSuccessResponse, ApiErrorResponse };
