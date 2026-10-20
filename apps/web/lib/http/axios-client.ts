import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorResponse, ApiResponse } from '@aayeshol/types';

import { useAuthStore } from '@/modular/account/store/auth.store';

/**
 * Standard API error model for strongly typed error handling across the application.
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(message: string, status = 500, errorCode = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

/**
 * Base configuration options for creating an Axios client instance.
 */
export interface CreateApiClientOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

/**
 * Internal extension of Axios request config to track retry status.
 */
export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Queue item interface for coordinating concurrent 401 responses.
 */
interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

/**
 * Checks whether a given request URL matches an authentication endpoint
 * that must be excluded from recursive token refresh attempts.
 */
function isPublicAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/verify-otp') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password') ||
    url.includes('/auth/resend-verification')
  );
}

/**
 * Resolves the backend API base URL from environment variables.
 * Falls back gracefully to an empty string if not configured.
 */
export function getBackendApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!url || !url.trim()) {
    return '';
  }

  const trimmed = url.trim();
  const normalized =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

  return normalized.replace(/\/+$/, '');
}

/**
 * Factory function to create a production-configured Axios instance.
 *
 * Configured with:
 * - `baseURL`: Configured strictly via NEXT_PUBLIC_BACKEND_API_URL (e.g. http://localhost:3001/api)
 * - `withCredentials`: true (ensures HTTP-only refresh token cookies are sent and received securely)
 * - `timeout`: 15,000ms default to prevent hanging requests
 * - Interceptors: In-memory token injection, concurrent 401 retry queue, silent token refresh, and standardized error mapping
 */
export function createApiClient(options: CreateApiClientOptions = {}): AxiosInstance {
  const baseURL = options.baseURL ?? getBackendApiUrl();

  const instance = axios.create({
    baseURL,
    timeout: options.timeout ?? 15000,
    withCredentials: options.withCredentials ?? true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });

  // Concurrency tracking for silent token refresh
  let isRefreshing = false;
  let failedQueue: QueueItem[] = [];

  const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else if (token) {
        prom.resolve(token);
      }
    });
    failedQueue = [];
  };

  // Request Interceptor: Injects short-lived in-memory JWT access token from Zustand auth store
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        if (config.headers && typeof config.headers.set === 'function') {
          if (!config.headers.has('Authorization')) {
            config.headers.set('Authorization', `Bearer ${token}`);
          }
        } else if (
          config.headers &&
          !config.headers.Authorization &&
          !config.headers.authorization
        ) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error: unknown) => {
      return Promise.reject(error);
    },
  );

  // Response Interceptor: Handles data pass-through, concurrent 401 refresh, and standardized error parsing
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError<ApiErrorResponse | { message?: string; error?: string }>) => {
      const originalRequest = error.config as RetryableRequestConfig | undefined;
      const status = error.response?.status ?? 500;
      const responseData = error.response?.data;

      // Extract user-facing message from ApiErrorResponse envelope
      const message =
        responseData?.message || error.message || 'An unexpected network or server error occurred.';

      const errorCode =
        responseData?.error ||
        (status === 401
          ? 'UNAUTHORIZED'
          : status === 403
            ? 'FORBIDDEN'
            : status === 404
              ? 'NOT_FOUND'
              : status >= 500
                ? 'INTERNAL_SERVER_ERROR'
                : 'API_ERROR');

      // Check whether this 401 request qualifies for automated token refresh
      const isExcluded = isPublicAuthEndpoint(originalRequest?.url);
      const canRetry = Boolean(originalRequest && !originalRequest._retry && !isExcluded);

      if (status === 401 && canRetry && originalRequest) {
        // If a refresh operation is already in progress, queue this request
        if (isRefreshing) {
          return new Promise<AxiosResponse>((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                if (typeof originalRequest.headers?.set === 'function') {
                  originalRequest.headers.set('Authorization', `Bearer ${token}`);
                } else if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                originalRequest._retry = true;
                resolve(instance(originalRequest));
              },
              reject: (err: unknown) => {
                reject(err);
              },
            });
          });
        }

        // Mark as retried to guarantee at most ONE retry attempt
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Direct POST call to /auth/refresh using configured baseURL
          const rawBase = instance.defaults.baseURL || getBackendApiUrl();
          const cleanBase = rawBase.replace(/\/+$/, '');
          const refreshUrl = cleanBase.endsWith('/api')
            ? `${cleanBase}/auth/refresh`
            : `${cleanBase}/api/auth/refresh`;

          const refreshResponse = await axios.post<ApiResponse<{ accessToken: string }>>(
            refreshUrl,
            {},
            {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            },
          );

          const responsePayload = refreshResponse.data;

          if (responsePayload && responsePayload.success && responsePayload.data.accessToken) {
            const newAccessToken = responsePayload.data.accessToken;

            // 1. Update Zustand store with the rotated access token
            useAuthStore.getState().setAccessToken(newAccessToken);

            // 2. Resolve all queued requests with the new token
            processQueue(null, newAccessToken);

            // 3. Retry original request with the new access token
            if (typeof originalRequest.headers?.set === 'function') {
              originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
            } else if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return instance(originalRequest);
          } else {
            const errorMessage =
              responsePayload && !responsePayload.success
                ? responsePayload.message
                : 'Token refresh failed.';
            throw new ApiClientError(errorMessage, 401, 'SESSION_EXPIRED');
          }
        } catch (refreshError: unknown) {
          const refreshStatus = (refreshError as AxiosError)?.response?.status;
          const isAuthFailure = refreshStatus === 401 || refreshStatus === 403;

          // Reject all queued requests
          processQueue(refreshError, null);

          // Clear credentials only on unrecoverable authentication errors (not on transient network errors)
          if (isAuthFailure) {
            const wasLoggedIn = useAuthStore.getState().isLoggedIn;
            useAuthStore.getState().clearAuth();
            if (wasLoggedIn) {
              useAuthStore.getState().setSessionExpired(true);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
              }
            }
          }

          const clientError = new ApiClientError(
            'Session expired. Please log in again.',
            401,
            'SESSION_EXPIRED',
            refreshError,
          );
          return Promise.reject(clientError);
        } finally {
          isRefreshing = false;
        }
      }

      // Cleanup when an explicit refresh attempt returns 401
      if (
        status === 401 &&
        typeof window !== 'undefined' &&
        originalRequest?.url?.includes('/auth/refresh')
      ) {
        const wasLoggedIn = useAuthStore.getState().isLoggedIn;
        useAuthStore.getState().clearAuth();
        if (wasLoggedIn) {
          useAuthStore.getState().setSessionExpired(true);
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      }

      const clientError = new ApiClientError(message, status, errorCode, responseData);
      return Promise.reject(clientError);
    },
  );

  return instance;
}

/**
 * Global shared Axios API Client singleton.
 */
export const apiClient = createApiClient();

/**
 * Type-safe HTTP helper utilities wrapping the Axios instance.
 */
export const http = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<ApiResponse<T>>(url, config).then((res) => res.data),

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<ApiResponse<T>>(url, data, config).then((res) => res.data),

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<ApiResponse<T>>(url, data, config).then((res) => res.data),

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<ApiResponse<T>>(url, data, config).then((res) => res.data),

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<ApiResponse<T>>(url, config).then((res) => res.data),
};
