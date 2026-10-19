'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, isTokenExpired } from '../store/auth.store';
import { authApi } from '../api/auth.api';
import { authKeys } from '../hooks/auth.keys';
import { clearUserSessionCache } from '@/lib/query';
import type { SafeUser } from '../types';

/**
 * Interface representing the exposed authentication context state and actions.
 */
export interface AuthContextValue {
  /** Authenticated user profile data (null if unauthenticated) */
  user: SafeUser | null;
  /** In-memory short-lived JWT access token */
  accessToken: string | null;
  /** Whether the user is currently authenticated with a valid session */
  isLoggedIn: boolean;
  /** Whether an active authentication or session restoration operation is pending */
  isLoading: boolean;
  /** Whether the initial session restoration and verification check has completed */
  isInitialized: boolean;
  /** Convenience flag indicating whether the authenticated user possesses the 'ADMIN' role */
  isAdmin: boolean;
  /** Whether the user's session has expired or been revoked */
  isSessionExpired: boolean;
  /** Access token expiration timestamp in milliseconds (null if unknown) */
  tokenExpiresAt: number | null;
  /** Triggers an immediate, silent session refresh using the HTTP-only refresh token cookie */
  refreshSession: () => Promise<boolean>;
  /** Explicitly logs the user out, invalidates server session, and purges all client caches */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Shared in-flight promise holder to deduplicate session restoration across React StrictMode double-mounts.
 */
let sessionRestorePromise: Promise<boolean> | null = null;

/**
 * Root Client Authentication Provider.
 *
 * Responsibilities:
 * 1. Coordinates initial session hydration and silent restoration on app load via HTTP-only cookie.
 * 2. Prevents unauthorized content flashing by managing `isInitialized` and `isLoading` states.
 * 3. Keeps Zustand auth store and TanStack Query user profile cache strictly synchronized.
 * 4. Listens for global `auth:unauthorized` events dispatched by Axios interceptors to wipe caches.
 * 5. Provides the `useAuth()` hook for clean, reactive authentication state throughout the application.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const tokenExpiresAt = useAuthStore((state) => state.tokenExpiresAt);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isSessionExpired = useAuthStore((state) => state.isSessionExpired);

  const setAuth = useAuthStore((state) => state.setAuth);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);
  const setIsInitialized = useAuthStore((state) => state.setIsInitialized);

  const isAdmin = useMemo(() => user?.role?.toUpperCase() === 'ADMIN', [user?.role]);

  /**
   * Silently refreshes the session from the backend using the HTTP-only cookie.
   * On success: updates access token, queries /auth/me for fresh profile, and hydrates caches.
   * On failure: resets auth state and purges user cache.
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (sessionRestorePromise) {
      return sessionRestorePromise;
    }

    sessionRestorePromise = (async () => {
      try {
        setIsLoading(true);
        const refreshRes = await authApi.refreshToken();

        if (refreshRes.success && refreshRes.data?.accessToken) {
          const newAccessToken = refreshRes.data.accessToken;

          // 1. Immediately store the rotated access token in Zustand
          useAuthStore.getState().setAccessToken(newAccessToken);

          // 2. Fetch authenticated user profile explicitly passing the new access token
          const meRes = await authApi.getCurrentUser(newAccessToken);
          if (meRes.success && meRes.data) {
            const profile = meRes.data;
            setAuth({ user: profile, accessToken: newAccessToken });
            queryClient.setQueryData(authKeys.user(), profile);
            return true;
          }
        }

        // If refresh was unsuccessful or profile could not be fetched
        clearAuth();
        clearUserSessionCache(queryClient);
        return false;
      } catch {
        clearAuth();
        clearUserSessionCache(queryClient);
        return false;
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
        sessionRestorePromise = null;
      }
    })();

    return sessionRestorePromise;
  }, [clearAuth, queryClient, setAuth, setIsInitialized, setIsLoading]);

  /**
   * Explicit user logout handler.
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authApi.logout();
    } catch {
      // Ignore network errors on logout to ensure client cleanup always proceeds
    } finally {
      clearAuth();
      clearUserSessionCache(queryClient);
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [clearAuth, queryClient, setIsLoading, setIsInitialized]);

  // Initial Session Hydration & Restoration
  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      const currentToken = useAuthStore.getState().accessToken;
      const currentUser = useAuthStore.getState().user;
      const currentExpiry = useAuthStore.getState().tokenExpiresAt;

      // If already initialized and access token is valid, skip restoration
      if (currentToken && currentUser && !isTokenExpired(currentExpiry ?? currentToken)) {
        if (isMounted) {
          setIsInitialized(true);
          setIsLoading(false);
        }
        return;
      }

      // If access token is in memory and valid, but user profile is missing, hydrate user profile
      if (currentToken && !isTokenExpired(currentExpiry ?? currentToken)) {
        try {
          const meRes = await authApi.getCurrentUser(currentToken);
          if (isMounted && meRes.success && meRes.data) {
            setUser(meRes.data);
            queryClient.setQueryData(authKeys.user(), meRes.data);
            setIsInitialized(true);
            setIsLoading(false);
            return;
          }
        } catch {
          // Fall back to refresh if token was rejected
        }
      }

      // If no valid access token in memory, attempt silent restoration via HTTP-only refresh cookie
      if (isMounted) {
        await refreshSession();
      }
    }

    void initializeSession();

    return () => {
      isMounted = false;
    };
  }, [queryClient, refreshSession, setIsInitialized, setIsLoading, setUser]);

  // Listen for global unauthorized events emitted by Axios interceptors
  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
      clearUserSessionCache(queryClient);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [clearAuth, queryClient]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoggedIn,
      isLoading,
      isInitialized,
      isAdmin,
      isSessionExpired,
      tokenExpiresAt,
      refreshSession,
      logout,
    }),
    [
      user,
      accessToken,
      isLoggedIn,
      isLoading,
      isInitialized,
      isAdmin,
      isSessionExpired,
      tokenExpiresAt,
      refreshSession,
      logout,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * Custom React hook to consume the current Authentication context.
 * Must be used within an <AuthProvider> tree.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
