import type { z } from 'zod';
import type {
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';

// Re-export shared contracts from monorepo packages
export type {
  SafeUser,
  LoginRequestPayload,
  VerifyLoginOtpRequestPayload,
  VerifyEmailRequestPayload,
  ForgotPasswordRequestPayload,
  ResetPasswordRequestPayload,
  LoginChallengeResponse,
  TokenPairResponse,
  ApiResponse,
} from '@aayeshol/types';

// Inferred TypeScript types from Zod schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * 2-Step OTP authentication process step discriminator.
 */
export type LoginStep = 'credentials' | 'otp';

/**
 * Form field error dictionary.
 */
export type FormErrors<T> = Partial<Record<keyof T | 'root', string>>;
