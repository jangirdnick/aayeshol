import { http } from '@/lib/http';
import type {
  ApiResponse,
  LoginRequestPayload,
  LoginChallengeResponse,
  VerifyLoginOtpRequestPayload,
  TokenPairResponse,
  ForgotPasswordRequestPayload,
  ResetPasswordRequestPayload,
  SafeUser,
} from '@/modular/account/types';

/**
 * Account & Authentication API service module.
 * Communicates with backend endpoints (/api/auth/*) using the shared type-safe Axios HTTP client.
 * Returns ApiResponse<T> which encapsulates both success ({ success: true, data: T }) and error branches.
 */
/**
 * In-flight promise holder to deduplicate concurrent or React StrictMode token refresh requests.
 * Prevents multiple simultaneous /auth/refresh calls from colliding with backend Refresh Token Rotation (RTR).
 */
let inFlightRefreshPromise: Promise<ApiResponse<{ accessToken: string }>> | null = null;

export const authApi = {
  /**
   * Step 1: Validate email & password credentials and dispatch a 2-Step OTP challenge.
   *
   * @param credentials - User email and password
   * @returns ApiResponse containing Challenge ID for step 2 verification (TTL: 5 minutes in Redis)
   */
  login: async (credentials: LoginRequestPayload): Promise<ApiResponse<LoginChallengeResponse>> => {
    return http.post<LoginChallengeResponse>('/auth/login', credentials);
  },

  /**
   * Step 2: Verify the 6-digit OTP code against the challenge ID to establish a session.
   * On success, backend sets an HTTP-only `refresh_token` cookie and returns the `accessToken` & `user`.
   *
   * @param payload - Challenge ID and 6-digit numeric OTP code
   * @returns ApiResponse containing Access token and safe user profile
   */
  verifyLoginOtp: async (
    payload: VerifyLoginOtpRequestPayload,
  ): Promise<ApiResponse<TokenPairResponse>> => {
    return http.post<TokenPairResponse>('/auth/verify-otp', payload);
  },

  /**
   * Request a self-service password recovery verification code.
   * Generates a 6-digit OTP challenge in Redis (TTL: 10 minutes) and sends email via Resend.
   *
   * @param payload - Registered email address
   * @returns ApiResponse containing Challenge ID for password reset
   */
  forgotPassword: async (
    payload: ForgotPasswordRequestPayload,
  ): Promise<ApiResponse<LoginChallengeResponse>> => {
    return http.post<LoginChallengeResponse>('/auth/forgot-password', payload);
  },

  /**
   * Complete password reset by verifying OTP code and setting a new strong password.
   *
   * @param payload - Challenge ID, 6-digit OTP, and new password
   */
  resetPassword: async (payload: ResetPasswordRequestPayload): Promise<ApiResponse<null>> => {
    return http.post<null>('/auth/reset-password', payload);
  },

  /**
   * Exchange the HTTP-only `refresh_token` cookie for a fresh 8-minute JWT access token.
   * Deduplicates concurrent calls via a shared in-flight promise.
   *
   * @returns ApiResponse containing fresh access token
   */
  refreshToken: async (): Promise<ApiResponse<{ accessToken: string }>> => {
    if (inFlightRefreshPromise) {
      return inFlightRefreshPromise;
    }

    inFlightRefreshPromise = http.post<{ accessToken: string }>('/auth/refresh').finally(() => {
      inFlightRefreshPromise = null;
    });

    return inFlightRefreshPromise;
  },

  /**
   * Fetch current authenticated user's profile details using the active Bearer token.
   *
   * @param token - Optional explicit access token (useful during session hydration before store state propagates)
   * @returns ApiResponse containing safe user entity
   */
  getCurrentUser: async (token?: string): Promise<ApiResponse<SafeUser>> => {
    return http.get<SafeUser>('/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  },

  /**
   * Invalidate current session in PostgreSQL and clear the HTTP-only refresh token cookie.
   */
  logout: async (): Promise<ApiResponse<null>> => {
    return http.post<null>('/auth/logout');
  },

  /**
   * Request a fresh email verification code if the previous one expired.
   *
   * @param payload - Email to receive the verification OTP
   */
  resendVerification: async (payload: { email: string }): Promise<ApiResponse<null>> => {
    return http.post<null>('/auth/resend-verification', payload);
  },
};
