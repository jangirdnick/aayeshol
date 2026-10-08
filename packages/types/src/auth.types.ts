/**
 * Safe user profile returned in API responses.
 * Never includes password hash, raw tokens, or OTPs.
 */
export interface SafeUser {
  id: string;
  name: string;
  lastName: string | null;
  email: string;
  emailVerified: boolean;
  avatar: string | null;
  role: string;
  createdAt: Date | string; // Dates are often serialized as ISO strings in JSON responses
  updatedAt: Date | string;
}

/**
 * Expected request body for POST /auth/register
 */
export interface RegisterRequestPayload {
  name: string;
  lastName?: string;
  email: string;
  password: string;
  avatar?: string;
}

/**
 * Expected request body for POST /auth/login
 */
export interface LoginRequestPayload {
  email: string;
  password: string;
}

/**
 * Expected request body for POST /auth/verify-otp
 */
export interface VerifyLoginOtpRequestPayload {
  challengeId: string;
  otp: string;
}

/**
 * Expected request body for POST /auth/verify-email
 */
export interface VerifyEmailRequestPayload {
  challengeId: string;
  otp: string;
}

/**
 * Expected request body for POST /auth/forgot-password
 */
export interface ForgotPasswordRequestPayload {
  email: string;
}

/**
 * Expected request body for POST /auth/reset-password
 */
export interface ResetPasswordRequestPayload {
  challengeId: string;
  otp: string;
  newPassword: string;
}

/**
 * Successful response data from POST /auth/login
 */
export interface LoginChallengeResponse {
  challengeId: string;
}

/**
 * Successful response data from POST /auth/register
 */
export interface RegisterChallengeResponse {
  challengeId: string;
  userId: string;
}

/**
 * Successful response data from POST /auth/verify-otp or POST /auth/refresh
 */
export interface TokenPairResponse {
  accessToken: string;
  user?: SafeUser;
}
