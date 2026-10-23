'use client';

import * as React from 'react';
import { SUPPORTED_SOCIAL_PLATFORMS } from '../constants';
import { useSocialAccountsQuery } from './use-social-accounts-query';
import { useDisconnectSocialMutation } from './use-disconnect-social-mutation';
import { useConnectSocial } from './use-connect-social';
import type { FilterStatus, SocialPlatformConfig, SupportedPlatformId } from '../types';

/**
 * Normalizes platform provider strings from backend enum (e.g. 'LINKEDIN', 'X_TWITTER', 'X', 'YOUTUBE', 'INSTAGRAM')
 * to our supported platform ID.
 */
function matchPlatformId(provider: string, platformId: SupportedPlatformId): boolean {
  const normProvider = provider.toUpperCase();
  const normId = platformId.toUpperCase();

  if (normProvider === normId) return true;
  if (normId === 'X_TWITTER' && (normProvider === 'X' || normProvider === 'TWITTER')) return true;
  return false;
}

export function useIntegrations() {
  const [filterStatus, setFilterStatus] = React.useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [disconnectTarget, setDisconnectTarget] = React.useState<SocialPlatformConfig | null>(null);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // 1. Fetch live connected social accounts from backend API (/api/social/accounts)
  const {
    data: connectedAccounts = [],
    isLoading: isAccountsLoading,
    isFetching: isAccountsFetching,
    refetch: refetchAccounts,
  } = useSocialAccountsQuery();

  // 2. Disconnect mutation
  const disconnectMutation = useDisconnectSocialMutation({
    onSuccess: () => {
      const name = disconnectTarget?.name || 'Account';
      setFeedbackMessage({
        type: 'info',
        text: `${name} disconnected. Scheduled posts for this channel are paused.`,
      });
      setDisconnectTarget(null);
    },
    onError: (err) => {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to disconnect account. Please try again.',
      });
    },
  });

  // 3. Connect OAuth initiation hook
  const { connect, connectingPlatform } = useConnectSocial({
    onInitiate: (platform) => {
      setFeedbackMessage({
        type: 'info',
        text: `Redirecting to ${platform} authorization screen...`,
      });
    },
    onError: (err, platform) => {
      setFeedbackMessage({
        type: 'error',
        text: `Failed to initiate ${platform} connection: ${err.message}`,
      });
    },
  });

  // Auto-dismiss feedback message after 5 seconds
  React.useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Read status query parameters from URL on mount (after OAuth callback redirect)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const platform = params.get('platform');
    const message = params.get('message');
    const account = params.get('account');

    if (status === 'success') {
      const platformDisplay = platform ? platform.toUpperCase() : 'Social account';
      const accountDisplay = account ? ` (${account})` : '';
      setFeedbackMessage({
        type: 'success',
        text: `${platformDisplay}${accountDisplay} connected successfully. Ready for scheduled publishing.`,
      });
      // Invalidate and refetch accounts list
      refetchAccounts();
      // Clean up URL query parameters without full page reload
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'error') {
      setFeedbackMessage({
        type: 'error',
        text: message
          ? decodeURIComponent(message)
          : 'Social account authorization was cancelled or failed.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refetchAccounts]);

  // Merge static platform metadata with live connected account status from backend
  const platforms = React.useMemo<SocialPlatformConfig[]>(() => {
    return SUPPORTED_SOCIAL_PLATFORMS.map((platform) => {
      const matchingAccount = connectedAccounts.find((acc) =>
        matchPlatformId(acc.provider, platform.id),
      );

      if (matchingAccount) {
        return {
          ...platform,
          account: {
            id: matchingAccount.id,
            name: matchingAccount.name,
            username: matchingAccount.name
              ? matchingAccount.name.startsWith('@')
                ? matchingAccount.name
                : `@${matchingAccount.name.toLowerCase().replace(/\s+/g, '')}`
              : null,
            email: matchingAccount.email,
            avatar: matchingAccount.avatar,
            profileUrl: null,
            connectedAt: matchingAccount.createdAt,
            hasRefreshToken: matchingAccount.hasRefreshToken,
            tokenExpiresAt: matchingAccount.tokenExpiresAt,
          },
        };
      }

      return {
        ...platform,
        account: null,
      };
    });
  }, [connectedAccounts]);

  const connectedCount = React.useMemo(() => {
    return platforms.filter((p) => Boolean(p.account)).length;
  }, [platforms]);

  const filteredPlatforms = React.useMemo(() => {
    return platforms.filter((p) => {
      const isConnected = Boolean(p.account);
      if (filterStatus === 'CONNECTED' && !isConnected) return false;
      if (filterStatus === 'DISCONNECTED' && isConnected) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        const matchesCapabilities = p.capabilities.some((c) => c.toLowerCase().includes(query));
        const matchesUsername = p.account?.username?.toLowerCase().includes(query);
        return matchesName || matchesCategory || matchesCapabilities || matchesUsername;
      }

      return true;
    });
  }, [platforms, filterStatus, searchQuery]);

  const connectPlatform = (platform: SocialPlatformConfig) => {
    connect(platform.id);
  };

  const confirmDisconnect = () => {
    if (!disconnectTarget?.account?.id) return;
    disconnectMutation.mutate(disconnectTarget.account.id);
  };

  const refreshAllTokens = () => {
    refetchAccounts().then(() => {
      setFeedbackMessage({
        type: 'success',
        text: 'All social channel connection statuses verified and synced with server.',
      });
    });
  };

  return {
    platforms,
    filteredPlatforms,
    connectedCount,
    totalPlatforms: platforms.length,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    disconnectTarget,
    setDisconnectTarget,
    isDisconnecting: disconnectMutation.isPending,
    connectingId: connectingPlatform,
    isRefreshing: isAccountsLoading || isAccountsFetching,
    feedbackMessage,
    setFeedbackMessage,
    connectPlatform,
    confirmDisconnect,
    refreshAllTokens,
  };
}
