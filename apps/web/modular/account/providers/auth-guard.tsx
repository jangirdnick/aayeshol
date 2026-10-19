'use client';

import React, { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from './auth-provider';

export interface AuthGuardProps {
  /** The protected application tree to render upon successful authentication and authorization */
  children: ReactNode;
  /**
   * Required user role(s) to access the protected view.
   * Defaults to ['ADMIN'] to restrict dashboard access to administrators.
   */
  requiredRoles?: string[];
  /** Target login URL for redirecting unauthenticated users. Defaults to '/account/login' */
  fallbackUrl?: string;
  /** Optional custom UI component to render while verifying session status */
  loadingFallback?: ReactNode;
  /** Optional custom UI component to render when user role is insufficient */
  unauthorizedFallback?: ReactNode;
}

/**
 * Production-Grade Client Authentication & Role Authorization Guard.
 *
 * Enforces:
 * 1. Non-logged-in users cannot access protected views; automatically redirected to `/account/login`.
 * 2. Role verification (defaults to requiring the 'ADMIN' role).
 * 3. Prevents flash of unauthorized content by displaying an accessible loading skeleton during session rehydration.
 * 4. Displays a user-friendly Access Denied view if a logged-in user lacks the required role.
 */
export function AuthGuard({
  children,
  requiredRoles = ['ADMIN'],
  fallbackUrl = '/account/login',
  loadingFallback,
  unauthorizedFallback,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, isLoading, isInitialized, logout } = useAuth();

  // Redirect unauthenticated users once initialization is complete
  useEffect(() => {
    if (isInitialized && !isLoading && (!isLoggedIn || !user)) {
      const redirectTarget = pathname
        ? `${fallbackUrl}?redirect=${encodeURIComponent(pathname)}`
        : fallbackUrl;
      router.replace(redirectTarget);
    }
  }, [fallbackUrl, isInitialized, isLoading, isLoggedIn, pathname, router, user]);

  // 1. Initializing / Loading state: render loading fallback to prevent content flicker
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
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-foreground tracking-tight">
              Verifying Authorization
            </h2>
            <p className="text-sm text-muted-foreground">
              Validating administrator session and security credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state: rendering redirect placeholder while router transitions
  if (!isLoggedIn || !user) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 text-foreground"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // 3. Role Authorization check: user is logged in, but role doesn't match requiredRoles
  const userRole = user.role?.toUpperCase();
  const hasRequiredRole =
    !requiredRoles || requiredRoles.length === 0 || requiredRoles.includes(userRole);

  if (!hasRequiredRole) {
    if (unauthorizedFallback) {
      return <>{unauthorizedFallback}</>;
    }

    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-destructive/20 bg-card p-6 shadow-xl sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
              <ShieldAlert className="size-8" aria-hidden="true" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Access Restricted
            </h1>

            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              This area is restricted to users with{' '}
              <span className="font-semibold text-foreground">ADMIN</span> privileges. Your account
              (<span className="font-medium text-foreground">{user.email}</span>) is currently
              assigned the{' '}
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground uppercase tracking-wider">
                {user.role}
              </span>{' '}
              role.
            </p>

            <div className="mt-6 flex w-full flex-col gap-2.5">
              <Button
                variant="default"
                className="w-full flex items-center justify-center gap-2"
                onClick={async () => {
                  await logout();
                  router.push('/account/login');
                }}
              >
                <LogOut className="size-4" />
                Switch to Admin Account
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="size-4" />
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized: User is authenticated and possesses the required role
  return <>{children}</>;
}

/**
 * Alias for AuthGuard as requested for semantic clarity.
 */
export const AuthChecker = AuthGuard;
export type AuthCheckerProps = AuthGuardProps;
