'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import type { ApiResponse, ResetPasswordRequestPayload } from '../types';

export type UseResetPasswordMutationOptions = Omit<
  UseMutationOptions<ApiResponse<null>, Error, ResetPasswordRequestPayload>,
  'mutationFn'
>;

/**
 * Mutation hook to complete password recovery using a valid challenge ID, 6-digit OTP code, and new password.
 */
export function useResetPasswordMutation(options?: UseResetPasswordMutationOptions) {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequestPayload) => authApi.resetPassword(payload),
    ...options,
  });
}
