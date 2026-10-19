'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { authKeys } from './auth.keys';
import type { ApiResponse, SafeUser } from '../types';

export type UseCurrentUserQueryOptions = Omit<
  UseQueryOptions<ApiResponse<SafeUser>, Error, SafeUser | null>,
  'queryKey' | 'queryFn'
>;

/**
 * Query hook to fetch the current authenticated user's profile from /auth/me.
 * Only executes when an active in-memory access token is present in Zustand.
 * Automatically synchronizes profile updates to Zustand.
 */
export function useCurrentUserQuery(options?: UseCurrentUserQueryOptions) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      }
      return response;
    },
    select: (res) => (res.success ? res.data : null),
    enabled: Boolean(accessToken && isLoggedIn),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}
