'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { socialApi } from '../api/social.api';
import { socialKeys } from './social.keys';
import type { ApiResponse } from '../types';

export type UseDisconnectSocialMutationOptions = Omit<
  UseMutationOptions<ApiResponse<null>, Error, string>,
  'mutationFn'
>;

/**
 * Mutation hook to disconnect a connected social media account by ID.
 * On success, automatically invalidates the connected accounts cache query.
 */
export function useDisconnectSocialMutation(options?: UseDisconnectSocialMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => socialApi.disconnectAccount(accountId),
    onSuccess: (data, variables, onMutateResult, context) => {
      // Invalidate connected accounts list so UI re-syncs immediately
      queryClient.invalidateQueries({ queryKey: socialKeys.accounts() });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    ...options,
  });
}
