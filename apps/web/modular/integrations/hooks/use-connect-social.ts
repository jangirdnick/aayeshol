'use client';

import * as React from 'react';
import { socialApi } from '../api/social.api';
import { useAuthStore } from '@/modular/account';
import type { SupportedPlatformId } from '../types';

export interface UseConnectSocialOptions {
  onInitiate?: (platform: SupportedPlatformId) => void;
  onError?: (error: Error, platform: SupportedPlatformId) => void;
}

/**
 * Hook to manage initiating social platform OAuth authorization.
 * Handles token extraction from Zustand auth store and redirects the browser
 * to the backend OAuth authorization initiation route.
 */
export function useConnectSocial(options?: UseConnectSocialOptions) {
  const [connectingPlatform, setConnectingPlatform] = React.useState<SupportedPlatformId | null>(
    null,
  );
  const accessToken = useAuthStore((state) => state.accessToken);

  const connect = React.useCallback(
    (platform: SupportedPlatformId) => {
      try {
        setConnectingPlatform(platform);
        options?.onInitiate?.(platform);
        socialApi.connect(platform, accessToken || undefined);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initiate connection');
        setConnectingPlatform(null);
        options?.onError?.(error, platform);
      }
    },
    [accessToken, options],
  );

  return {
    connect,
    connectingPlatform,
    isConnecting: Boolean(connectingPlatform),
  };
}
