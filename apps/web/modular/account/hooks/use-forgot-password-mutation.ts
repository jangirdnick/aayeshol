'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import type { ApiResponse, ForgotPasswordRequestPayload, LoginChallengeResponse } from '../types';

export type UseForgotPasswordMutationOptions = Omit<
  UseMutationOptions<ApiResponse<LoginChallengeResponse>, Error, ForgotPasswordRequestPayload>,
  'mutationFn'
>;

/**
 * Mutation hook to initiate password recovery.
 * Requests a 6-digit OTP code sent to the user's email and returns a recovery challenge ID.
 */
export function useForgotPasswordMutation(options?: UseForgotPasswordMutationOptions) {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequestPayload) => authApi.forgotPassword(payload),
    ...options,
  });
}
