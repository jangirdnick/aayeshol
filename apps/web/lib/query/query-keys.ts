/**
 * Centralized, type-safe Query Key factory for Aayeshol.
 * Follows hierarchical tuple conventions for fine-grained cache management and targeted invalidation.
 *
 * Pattern:
 * - Root domain key: ['domain']
 * - Domain lists: ['domain', 'list', filters]
 * - Domain details: ['domain', 'detail', id]
 */
export const queryKeys = {
  /** Authentication & Session keys */
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    challenge: (id: string) => [...queryKeys.auth.all, 'challenge', id] as const,
  },

  /** User profile and preferences keys */
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
  },

  /** Connected social media accounts (LinkedIn, X, Instagram, YouTube) */
  social: {
    all: ['social'] as const,
    accounts: () => [...queryKeys.social.all, 'accounts'] as const,
    account: (id: string) => [...queryKeys.social.all, 'account', id] as const,
    status: (platform: string) => [...queryKeys.social.all, 'status', platform] as const,
  },

  /** Social publishing posts and schedules */
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.posts.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
  },

  /** Media assets from Google Drive or uploads */
  media: {
    all: ['media'] as const,
    driveFiles: (folderId?: string) =>
      [...queryKeys.media.all, 'drive', folderId ?? 'root'] as const,
  },

  /** Analytics and publication metrics */
  analytics: {
    all: ['analytics'] as const,
    overview: (timeRange?: string) =>
      [...queryKeys.analytics.all, 'overview', timeRange ?? '30d'] as const,
  },
} as const;
