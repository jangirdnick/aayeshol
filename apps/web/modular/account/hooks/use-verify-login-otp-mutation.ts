'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { authKeys } from './auth.keys';
import type { ApiResponse, VerifyLoginOtpRequestPayload, TokenPairResponse } from '../types';

export type UseVerifyLoginOtpMutationOptions = Omit<
  UseMutationOptions<ApiResponse<TokenPairResponse>, Error, VerifyLoginOtpRequestPayload>,
  'mutationFn'
>;

/**
 * Mutation hook to complete Step 2 of the 2-Step OTP login flow.
 * Validates the 6-digit OTP code against the challengeId, establishes the session,
 * and synchronizes the authenticated user and in-memory access token with Zustand & TanStack Query.
 */
export function useVerifyLoginOtpMutation(options?: UseVerifyLoginOtpMutationOptions) {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    ...options,
    mutationFn: (payload: VerifyLoginOtpRequestPayload) => authApi.verifyLoginOtp(payload),
    onSuccess: (response, variables, onMutateResult, context) => {
      // 1. Synchronize in-memory access token & session state with Zustand if successful
      if (response.success && response.data) {
        const { user, accessToken } = response.data;
        if (user && accessToken) {
          setAuth({ user, accessToken });

          // 2. Hydrate TanStack Query user profile cache
          queryClient.setQueryData(authKeys.user(), user);
        }
      }

      // 3. Delegate to caller-provided onSuccess callback
      options?.onSuccess?.(response, variables, onMutateResult, context);
    },
  });
}
