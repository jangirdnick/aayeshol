import { http } from '@/lib/http';
import { getBackendApiUrl } from '@/lib/http/axios-client';
import type { ApiResponse, ConnectedSocialAccount, SupportedPlatformId } from '../types';

/**
 * Maps SupportedPlatformId to backend OAuth route endpoints (/api/social/:endpoint).
 */
export const PLATFORM_ENDPOINT_MAP: Record<SupportedPlatformId, string> = {
  YOUTUBE: 'youtube',
  LINKEDIN: 'linkedin',
  X_TWITTER: 'x',
  INSTAGRAM: 'instagram',
};

/**
 * Social Media Integrations API Service Module.
 * Communicates with backend endpoints (/api/social/*) using the shared type-safe Axios HTTP client.
 * Returns ApiResponse<T> which encapsulates both success and error branches.
 */
export const socialApi = {
  /**
   * Retrieves all social accounts connected by the authenticated user.
   * Excludes sensitive OAuth tokens (AES-encrypted in isolated database store).
   *
   * @returns ApiResponse containing list of safe connected social accounts
   */
  getAccounts: async (): Promise<ApiResponse<ConnectedSocialAccount[]>> => {
    return http.get<ConnectedSocialAccount[]>('/social/accounts');
  },

  /**
   * Disconnects and permanently deletes a connected social media account and its encrypted tokens.
   *
   * @param accountId - CUID identifier of the social account to disconnect
   * @returns ApiResponse with null data on success
   */
  disconnectAccount: async (accountId: string): Promise<ApiResponse<null>> => {
    return http.delete<null>(`/social/accounts/${accountId}`);
  },

  /**
   * Generates the OAuth authorization initiation URL for a given platform.
   *
   * @param platform - Target social media platform ('LINKEDIN', 'X_TWITTER', 'INSTAGRAM', 'YOUTUBE')
   * @param token - Optional JWT access token to attach as query parameter for browser navigation
   * @returns Fully qualified OAuth initiation URL
   */
  getConnectUrl: (platform: SupportedPlatformId, token?: string): string => {
    const rawBase = getBackendApiUrl();
    const cleanBase = rawBase ? rawBase.replace(/\/+$/, '') : '';
    const endpoint = PLATFORM_ENDPOINT_MAP[platform];
    const fullPath = cleanBase.endsWith('/api')
      ? `${cleanBase}/social/${endpoint}`
      : `${cleanBase}/api/social/${endpoint}`;

    if (token) {
      try {
        const url = new URL(fullPath);
        url.searchParams.set('token', token);
        return url.toString();
      } catch {
        return `${fullPath}?token=${encodeURIComponent(token)}`;
      }
    }
    return fullPath;
  },

  /**
   * Initiates the OAuth connection by redirecting the browser to the backend OAuth authorization endpoint.
   *
   * @param platform - Target social platform
   * @param token - Optional JWT access token from Zustand auth store
   */
  connect: (platform: SupportedPlatformId, token?: string): void => {
    const url = socialApi.getConnectUrl(platform, token);
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  },

  /**
   * Performs an API-level initiation call (useful for preflight or JSON-format handshakes).
   *
   * @param platform - Target social platform
   */
  initiateConnect: async (platform: SupportedPlatformId): Promise<ApiResponse<unknown>> => {
    const endpoint = PLATFORM_ENDPOINT_MAP[platform];
    return http.get(`/social/${endpoint}`);
  },
};
