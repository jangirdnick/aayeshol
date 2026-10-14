'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SafeUser } from '@aayeshol/types';
import { queryKeys } from './query-keys';

import { http } from '@/modular/lib/http';

/**
 * Example fetcher function demonstrating type-safe API communication with Axios.
 */
async function fetchUserProfile(): Promise<SafeUser> {
  const result = await http.get<SafeUser>('/user/profile');
  if (!result.success) {
    throw new Error(result.message);
  }
  return result.data;
}

/**
 * Example mutation function demonstrating Axios PATCH with cache invalidation pattern.
 */
async function updateUserProfile(
  payload: Partial<Pick<SafeUser, 'name' | 'lastName' | 'avatar'>>,
): Promise<SafeUser> {
  const result = await http.patch<SafeUser>('/user/profile', payload);
  if (!result.success) {
    throw new Error(result.message);
  }
  return result.data;
}

/**
 * Example Client Component demonstrating TanStack Query best practices in Aayeshol:
 * 1. Defining and utilizing type-safe query keys (`queryKeys.user.profile()`).
 * 2. Proper handling of `isLoading`, `isError`, and `data` states.
 * 3. Mutation handling with automated cache invalidation.
 */
export function UserProfileQueryExample() {
  const queryClient = useQueryClient();

  // 1. Fetching server state using useQuery
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: fetchUserProfile,
    enabled: true, // Conditionally enable if needed (e.g. when authenticated)
  });

  // 2. Mutating server state and invalidating cache
  const updateMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      // Invalidate the query key to trigger background refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.profile(),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground animate-pulse">Loading profile...</div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 rounded-md border border-destructive/20 bg-destructive/10 text-destructive text-sm">
        Error loading profile: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-4 rounded-lg border border-border bg-card text-card-foreground space-y-2">
      <h3 className="font-semibold text-base">
        {user.name} {user.lastName ?? ''}
      </h3>
      <p className="text-sm text-muted-foreground">{user.email}</p>
      <button
        type="button"
        disabled={updateMutation.isPending}
        onClick={() => updateMutation.mutate({ name: `${user.name} (Updated)` })}
        className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
      >
        {updateMutation.isPending ? 'Saving...' : 'Trigger Update Mutation'}
      </button>
    </div>
  );
}
