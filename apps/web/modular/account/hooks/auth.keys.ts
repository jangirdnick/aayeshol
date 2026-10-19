import { queryKeys } from '@/lib/query';

/**
 * Centralized query keys for the authentication domain.
 * Integrates with the global queryKeys factory to ensure consistent cache invalidation.
 */
export const authKeys = {
  all: queryKeys.auth.all,
  session: queryKeys.auth.session,
  user: queryKeys.user.profile,
  challenge: (id: string) => queryKeys.auth.challenge(id),
} as const;
