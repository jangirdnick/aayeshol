'use client';

import * as React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/lib/query';
import { AxiosProvider } from '@/lib/http';
import { AuthProvider } from '@/modular/account';

export interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root Client Providers wrapper.
 * Composes application-wide context providers (Theme, TanStack Query, Axios, Authentication, etc.)
 * while maintaining strict Server Component boundaries for app/layout.tsx.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AxiosProvider>
        <AuthProvider>
          <ThemeProvider defaultTheme="system" storageKey="aayeshol-theme">
            {children}
          </ThemeProvider>
        </AuthProvider>
      </AxiosProvider>
    </QueryProvider>
  );
}
