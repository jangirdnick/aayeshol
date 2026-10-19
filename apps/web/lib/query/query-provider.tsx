'use client';

import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from './query-client';

export interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Root Client Component wrapper for TanStack Query.
 *
 * Guarantees a stable QueryClient reference across component re-renders
 * using React.useState initialization, while preserving strict SSR boundary isolation.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Use useState to ensure the client is created only once per client component mount
  const [queryClient] = React.useState(() => getQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
