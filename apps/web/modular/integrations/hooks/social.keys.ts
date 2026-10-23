import { queryKeys } from '@/lib/query';

/**
 * Centralized query keys for the social media integrations domain.
 * Integrates with the global queryKeys factory to ensure consistent cache invalidation across the monorepo.
 */
export const socialKeys = {
  all: queryKeys.social.all,
  accounts: queryKeys.social.accounts,
  account: (id: string) => queryKeys.social.account(id),
  status: (platform: string) => queryKeys.social.status(platform),
} as const;
