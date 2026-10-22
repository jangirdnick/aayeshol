'use client';

import * as React from 'react';
import { SUPPORTED_SOCIAL_PLATFORMS } from '../constants';
import type { FilterStatus, SocialPlatformConfig } from '../types';

export function useIntegrations() {
  const [platforms, setPlatforms] = React.useState<SocialPlatformConfig[]>(() => {
    return SUPPORTED_SOCIAL_PLATFORMS.map((platform) => {
      if (platform.id === 'LINKEDIN') {
        return {
          ...platform,
          account: {
            id: 'soc_linkedin_01',
            name: 'Anton Avilov',
            username: 'anton-avilov',
            email: 'anton.avilov@example.com',
            avatar: null,
            profileUrl: 'https://linkedin.com/in/anton-avilov',
            connectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          },
        };
      }
      if (platform.id === 'INSTAGRAM') {
        return {
          ...platform,
          account: {
            id: 'soc_instagram_01',
            name: 'Aayeshol Creative Studio',
            username: 'aayeshol.studio',
            email: null,
            avatar: null,
            profileUrl: 'https://instagram.com/aayeshol.studio',
            connectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
          },
        };
      }
      return platform;
    });
  });

  const [filterStatus, setFilterStatus] = React.useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [disconnectTarget, setDisconnectTarget] = React.useState<SocialPlatformConfig | null>(null);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);
  const [connectingId, setConnectingId] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

  React.useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

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
    setConnectingId(platform.id);
    setTimeout(() => {
      setPlatforms((prev) =>
        prev.map((item) => {
          if (item.id === platform.id) {
            return {
              ...item,
              account: {
                id: `soc_${platform.id.toLowerCase()}_${Date.now()}`,
                name: `${platform.name} Channel`,
                username: `${platform.id.toLowerCase()}_creator`,
                email: 'creator@aayeshol.com',
                avatar: null,
                profileUrl: null,
                connectedAt: new Date().toISOString(),
              },
            };
          }
          return item;
        }),
      );
      setConnectingId(null);
      setFeedbackMessage({
        type: 'success',
        text: `${platform.name} connected successfully. Ready for scheduled delivery.`,
      });
    }, 700);
  };

  const confirmDisconnect = () => {
    if (!disconnectTarget) return;

    setIsDisconnecting(true);
    setTimeout(() => {
      setPlatforms((prev) =>
        prev.map((item) => {
          if (item.id === disconnectTarget.id) {
            return {
              ...item,
              account: null,
            };
          }
          return item;
        }),
      );
      const disconnectedName = disconnectTarget.name;
      setIsDisconnecting(false);
      setDisconnectTarget(null);
      setFeedbackMessage({
        type: 'info',
        text: `${disconnectedName} disconnected. Scheduled posts are currently paused.`,
      });
    }, 500);
  };

  const refreshAllTokens = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setFeedbackMessage({
        type: 'success',
        text: 'All social channel tokens verified and active.',
      });
    }, 600);
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
    isDisconnecting,
    connectingId,
    isRefreshing,
    feedbackMessage,
    setFeedbackMessage,
    connectPlatform,
    confirmDisconnect,
    refreshAllTokens,
  };
}
