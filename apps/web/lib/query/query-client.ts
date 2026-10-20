import { QueryClient, isServer } from '@tanstack/react-query';

/**
 * Determines whether a query failure should be retried.
 * - Caps retries at 2 attempts for transient failures.
 * - Suppresses retries on permanent HTTP 4xx client errors (e.g., 400, 401, 403, 404, 422).
 */
function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false;
  }

  if (typeof error === 'object' && error !== null) {
    const status =
      (error as { status?: number; statusCode?: number }).status ??
      (error as { status?: number; statusCode?: number }).statusCode;

    if (typeof status === 'number' && status >= 400 && status < 500) {
      return false;
    }
  }

  return true;
}

/**
 * Factory function to create a new QueryClient instance configured with production-ready defaults:
 * - `staleTime`: 1 minute (60s) to minimize redundant network roundtrips.
 * - `gcTime`: 10 minutes to retain inactive queries in memory before garbage collection.
 * - `retry`: Smart retry logic ignoring permanent 4xx client errors.
 * - `refetchOnWindowFocus`: Active only when data is stale.
 * - `refetchOnReconnect`: Automatic refetch on network reconnect.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: shouldRetryQuery,
        refetchOnWindowFocus: true, // Only triggers if data is stale (> staleTime)
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: false, // Never retry mutations automatically to prevent unintended duplicate writes
      },
    },
  });
}

/**
 * Singleton holder for the browser-side QueryClient.
 * Kept undefined on the server to prevent cross-request cache leaks.
 */
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Returns the appropriate QueryClient instance depending on the runtime environment:
 * - Server: Always instantiates a fresh QueryClient per request (zero cache pollution across SSR sessions).
 * - Browser: Reuses a stable singleton QueryClient across the application lifetime.
 */
export function getQueryClient(): QueryClient {
  if (isServer) {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}

/**
 * Clears and invalidates all user-specific queries in the cache upon logout or session switch.
 * Ensures that sensitive user data, social accounts, and publication drafts do not leak across sessions.
 *
 * @param queryClient Optional specific QueryClient instance. Defaults to the browser singleton.
 */
export function clearUserSessionCache(queryClient?: QueryClient): void {
  const targetClient = queryClient ?? getQueryClient();
  targetClient.clear();
}
