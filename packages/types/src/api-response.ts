/**
 * Standardized API response envelope used across all Aayeshol API endpoints.
 */
export interface ApiSuccessResponse<T = null> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: string;
}

export type ApiResponse<T = null> = ApiSuccessResponse<T> | ApiErrorResponse;
