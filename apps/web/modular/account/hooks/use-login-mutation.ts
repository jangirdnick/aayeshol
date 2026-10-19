'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import type { ApiResponse, LoginRequestPayload, LoginChallengeResponse } from '../types';

export type UseLoginMutationOptions = Omit<
  UseMutationOptions<ApiResponse<LoginChallengeResponse>, Error, LoginRequestPayload>,
  'mutationFn'
>;

/**
 * Mutation hook to initiate Step 1 of the 2-Step OTP login flow.
 * Validates credentials with the server and receives a challengeId.
 */
export function useLoginMutation(options?: UseLoginMutationOptions) {
  return useMutation({
    mutationFn: (credentials: LoginRequestPayload) => authApi.login(credentials),
    ...options,
  });
}
