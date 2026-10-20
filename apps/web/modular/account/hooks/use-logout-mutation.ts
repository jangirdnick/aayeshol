'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import type { ApiResponse } from '../types';

export type UseLogoutMutationOptions = Omit<
  UseMutationOptions<ApiResponse<null>, Error, void>,
  'mutationFn'
>;

/**
 * Mutation hook to log out the user.
 * Invalidates the server session, revokes the refresh token cookie, resets the Zustand auth store,
 * and clears the entire TanStack Query cache to guarantee zero cross-user cache leaks.
 */
export function useLogoutMutation(options?: UseLogoutMutationOptions) {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    ...options,
    mutationFn: () => authApi.logout(),
    onSettled: (data, error, variables, onMutateResult, context) => {
      // 1. Reset client-side auth state
      clearAuth();

      // 2. Clear entire query cache (wipes all posts, profiles, and media from memory)
      queryClient.clear();

      // 3. Delegate to caller-provided onSettled callback with all TanStack Query arguments
      options?.onSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}
