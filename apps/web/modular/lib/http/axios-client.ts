import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorResponse, ApiResponse } from '@aayeshol/types';

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
 * Factory function to create a production-configured Axios instance.
 *
 * Configured with:
 * - `baseURL`: Configured via NEXT_PUBLIC_API_URL or defaults to `/api` (for Next.js rewrites/local API)
 * - `withCredentials`: true (ensures HTTP-only refresh token cookies are sent and received securely)
 * - `timeout`: 15,000ms default to prevent hanging requests
 * - Interceptors: Standardized error parsing into ApiClientError and standard headers
 */
export function createApiClient(options: CreateApiClientOptions = {}): AxiosInstance {
  const defaultBaseURL =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined' ? '/api' : 'http://localhost:3001');

  const instance = axios.create({
    baseURL: options.baseURL ?? defaultBaseURL,
    timeout: options.timeout ?? 15000,
    withCredentials: options.withCredentials ?? true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });

  // Request Interceptor
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Access tokens are handled via HTTP-Only cookies or short-lived auth headers if needed
      return config;
    },
    (error: unknown) => {
      return Promise.reject(error);
    },
  );

  // Response Interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError<ApiErrorResponse | { message?: string; error?: string }>) => {
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

      const clientError = new ApiClientError(message, status, errorCode, responseData);

      // Handle 401 Unauthorized globally if in browser
      if (status === 401 && typeof window !== 'undefined') {
        // Dispatch custom session expiration event for coordinated UI/cache clearing
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

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
