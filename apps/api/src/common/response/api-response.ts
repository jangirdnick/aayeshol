import type { ApiSuccessResponse } from '@aayeshol/types';

/**
 * Creates a standardized success response.
 */
export function successResponse<T>(message: string, data: T): ApiSuccessResponse<T> {
  return { success: true, message, data };
}
