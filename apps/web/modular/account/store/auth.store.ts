import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SafeUser } from '@aayeshol/types';

/**
 * State contract for the Authentication store.
 * Holds user profile, in-memory JWT access token, and session indicators.
 */
export interface AuthState {
  /** Authenticated user profile data (null if unauthenticated) */
  user: SafeUser | null;
  /** Whether the user is currently authenticated */
  isLoggedIn: boolean;
  /** In-memory short-lived JWT access token (8m lifetime). Kept in memory to prevent XSS theft. */
  accessToken: string | null;
  /** Expiration timestamp (ms) of the access token, derived from JWT exp claim or backend */
  tokenExpiresAt: number | null;
  /** Whether the user's refresh token / session has expired or been revoked */
  isSessionExpired: boolean;
  /** Loading flag during asynchronous token rehydration or authentication operations */
  isLoading: boolean;
  /** Whether initial session restoration / authentication check has completed */
  isInitialized: boolean;

  // Backward-compatible snake_case aliases
  is_loggedIn: boolean;
  access_token: string;
  session_expired: boolean;
}

/**
 * Action methods for mutating the Authentication store.
 */
export interface AuthActions {
  /**
   * Sets user and access token in an atomic transaction upon successful login/OTP verification.
   */
  setAuth: (payload: {
    user: SafeUser;
    accessToken: string;
    tokenExpiresAt?: number | null;
  }) => void;

  /**
   * Updates only the access token (called after silent /auth/refresh rotation).
   */
  setAccessToken: (accessToken: string | null, tokenExpiresAt?: number | null) => void;

  /**
   * Updates user profile data (e.g. after /auth/me or profile edits).
   */
  setUser: (user: SafeUser | null) => void;

  /**
   * Toggles the logged-in flag directly.
   */
  setIsLoggedIn: (isLoggedIn: boolean) => void;

  /**
   * Marks whether the session has expired (triggers re-auth modals or redirect).
   */
  setSessionExpired: (isExpired: boolean) => void;

  /**
   * Sets store loading state.
   */
  setIsLoading: (isLoading: boolean) => void;

  /**
   * Sets whether the initial session hydration check has concluded.
   */
  setIsInitialized: (isInitialized: boolean) => void;

  /**
   * Completely clears user, tokens, and resets session state upon logout.
   */
  clearAuth: () => void;

  /**
   * Alias for clearAuth.
   */
  logout: () => void;

  // Backward-compatible alias
  setIsLoggedin: (is_loggedIn: boolean) => void;
}

/**
 * Combined Zustand store type.
 */
export type AuthStore = AuthState & AuthActions;

/**
 * Safely parses the expiration timestamp (in milliseconds) from a JWT access token string.
 * Returns null if the token is invalid, unparseable, or missing an 'exp' claim.
 */
export function extractTokenExpiry(token: string | null | undefined): number | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const parsed = JSON.parse(jsonPayload) as { exp?: number };
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Checks whether a given JWT access token or expiration timestamp is expired.
 * Includes a configurable buffer (default: 10 seconds) to prevent edge-of-expiry race conditions.
 */
export function isTokenExpired(
  tokenOrExpiry: string | number | null | undefined,
  bufferMs = 10000,
): boolean {
  if (!tokenOrExpiry) return true;
  const expiryMs =
    typeof tokenOrExpiry === 'number' ? tokenOrExpiry : extractTokenExpiry(tokenOrExpiry);
  if (!expiryMs) return false;
  return Date.now() >= expiryMs - bufferMs;
}

/**
 * Initial clean state.
 */
const initialState: AuthState = {
  user: null,
  isLoggedIn: false,
  accessToken: null,
  tokenExpiresAt: null,
  isSessionExpired: false,
  isLoading: false,
  isInitialized: false,

  // Backward-compatible properties
  is_loggedIn: false,
  access_token: '',
  session_expired: false,
};

/**
 * Production-Grade Zustand Authentication Store.
 *
 * Security Architecture:
 * - Access Token: Kept exclusively in JavaScript memory to eliminate XSS exfiltration risks.
 * - Refresh Token: Stored and transmitted solely via HTTP-only, Secure, SameSite=Lax cookie.
 * - Session State: Reactive across all UI components, accessible directly outside React (e.g. Axios interceptors).
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setAuth: ({ user, accessToken, tokenExpiresAt }) => {
        const computedExpiry = tokenExpiresAt ?? extractTokenExpiry(accessToken);
        set(
          {
            user,
            accessToken,
            tokenExpiresAt: computedExpiry,
            isLoggedIn: true,
            isSessionExpired: false,
            isLoading: false,
            isInitialized: true,
            // Sync aliases
            access_token: accessToken,
            is_loggedIn: true,
            session_expired: false,
          },
          false,
          'auth/setAuth',
        );
      },

      setAccessToken: (accessToken, tokenExpiresAt) => {
        const computedExpiry = tokenExpiresAt ?? extractTokenExpiry(accessToken);
        set(
          {
            accessToken,
            tokenExpiresAt: computedExpiry,
            isLoggedIn: Boolean(accessToken),
            isSessionExpired: false,
            // Sync aliases
            access_token: accessToken ?? '',
            is_loggedIn: Boolean(accessToken),
            session_expired: false,
          },
          false,
          'auth/setAccessToken',
        );
      },

      setUser: (user) =>
        set(
          {
            user,
            isLoggedIn: Boolean(user),
            // Sync aliases
            is_loggedIn: Boolean(user),
          },
          false,
          'auth/setUser',
        ),

      setIsLoggedIn: (isLoggedIn) =>
        set(
          {
            isLoggedIn,
            is_loggedIn: isLoggedIn,
          },
          false,
          'auth/setIsLoggedIn',
        ),

      setIsLoggedin: (is_loggedIn) =>
        set(
          {
            isLoggedIn: is_loggedIn,
            is_loggedIn,
          },
          false,
          'auth/setIsLoggedin',
        ),

      setSessionExpired: (isSessionExpired) =>
        set(
          {
            isSessionExpired,
            session_expired: isSessionExpired,
            ...(isSessionExpired
              ? {
                  accessToken: null,
                  tokenExpiresAt: null,
                  access_token: '',
                  isLoggedIn: false,
                  is_loggedIn: false,
                }
              : {}),
          },
          false,
          'auth/setSessionExpired',
        ),

      setIsLoading: (isLoading) => set({ isLoading }, false, 'auth/setIsLoading'),

      setIsInitialized: (isInitialized) => set({ isInitialized }, false, 'auth/setIsInitialized'),

      clearAuth: () =>
        set(
          {
            ...initialState,
            isInitialized: true,
          },
          false,
          'auth/clearAuth',
        ),

      logout: () =>
        set(
          {
            ...initialState,
            isInitialized: true,
          },
          false,
          'auth/logout',
        ),
    }),
    {
      name: 'AayesholAuthStore',
      enabled: process.env.NODE_ENV !== 'production',
    },
  ),
);

/**
 * Backward-compatible alias for existing imports.
 */
export const authSlice = useAuthStore;

/**
 * Non-reactive static getters and utilities for use outside React components
 * (e.g. inside Axios interceptors, route guards, background queues).
 */

/**
 * Retrieves the current in-memory JWT access token directly from the store.
 */
export function getAuthToken(): string | null {
  return useAuthStore.getState().accessToken;
}

/**
 * Checks whether an authenticated session is currently active in memory.
 */
export function isAuthenticated(): boolean {
  return useAuthStore.getState().isLoggedIn;
}

/**
 * Determines whether the currently authenticated user possesses the 'ADMIN' role.
 */
export function isAdminUser(): boolean {
  const user = useAuthStore.getState().user;
  return user?.role?.toUpperCase() === 'ADMIN';
}

/**
 * Checks whether the current session is valid (user present, token present and unexpired).
 */
export function isSessionValid(): boolean {
  const { accessToken, tokenExpiresAt, user, isLoggedIn } = useAuthStore.getState();
  if (!isLoggedIn || !accessToken || !user) return false;
  return !isTokenExpired(tokenExpiresAt ?? accessToken);
}

/**
 * Resets the authentication store state directly without hooks.
 */
export function clearSession(): void {
  useAuthStore.getState().clearAuth();
}
