'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { socialApi } from '../api/social.api';
import { socialKeys } from './social.keys';
import { useAuthStore } from '@/modular/account';
import type { ApiResponse, ConnectedSocialAccount } from '../types';

export type UseSocialAccountsQueryOptions = Omit<
  UseQueryOptions<ApiResponse<ConnectedSocialAccount[]>, Error, ConnectedSocialAccount[]>,
  'queryKey' | 'queryFn'
>;

/**
 * Query hook to fetch all connected social accounts for the authenticated user from /api/social/accounts.
 * Automatically synchronizes with TanStack Query cache and only runs when user is logged in with an active access token.
 */
export function useSocialAccountsQuery(options?: UseSocialAccountsQueryOptions) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: socialKeys.accounts(),
    queryFn: async () => {
      return socialApi.getAccounts();
    },
    select: (res) => (res.success && Array.isArray(res.data) ? res.data : []),
    enabled: Boolean(accessToken && isLoggedIn),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    ...options,
  });
}
