'use client';

import React, { useEffect, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from './auth-provider';

export interface GuestGuardProps {
  /** The public authentication component/tree to render for guests */
  children: ReactNode;
  /** Redirect destination if user is already authenticated. Defaults to '/dashboard' or ?redirect= query */
  fallbackUrl?: string;
  /** Custom loading skeleton while session status is resolving */
  loadingFallback?: ReactNode;
}

/**
 * Guest Guard / Guest Provider.
 * Restricts access to public authentication routes (login, forgot-password, reset-password).
 * If a user is already authenticated with an active session, automatically redirects them
 * to the dashboard or their intended destination URL.
 */
export function GuestGuard({
  children,
  fallbackUrl = '/dashboard',
  loadingFallback,
}: GuestGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || fallbackUrl;
  const { isLoggedIn, isInitialized, isLoading } = useAuth();

  useEffect(() => {
    if (isInitialized && !isLoading && isLoggedIn) {
      router.replace(redirectTarget);
    }
  }, [isInitialized, isLoading, isLoggedIn, redirectTarget, router]);

  // 1. Initializing / Loading state: render loading spinner to prevent flash of login forms
  if (!isInitialized || isLoading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }

    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 text-foreground"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // 2. Already logged in: render loading spinner while router transitions to dashboard
  if (isLoggedIn) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 text-foreground"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // 3. Unauthenticated guest: render public authentication screens safely
  return <>{children}</>;
}

/**
 * Semantic alias for GuestGuard.
 */
export const GuestProvider = GuestGuard;
export type GuestProviderProps = GuestGuardProps;
