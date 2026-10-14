'use client';

import * as React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/modular/lib/query';
import { AxiosProvider } from '@/modular/lib/http';

export interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root Client Providers wrapper.
 * Composes application-wide context providers (Theme, TanStack Query, Axios, etc.)
 * while maintaining strict Server Component boundaries for app/layout.tsx.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AxiosProvider>
        <ThemeProvider defaultTheme="system" storageKey="aayeshol-theme">
          {children}
        </ThemeProvider>
      </AxiosProvider>
    </QueryProvider>
  );
}
