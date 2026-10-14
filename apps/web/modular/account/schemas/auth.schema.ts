import { z } from 'zod';
import { EMAIL_REGEX, STRONG_PASSWORD_REGEX, OTP_REGEX } from '../utils/regex.util';

/**
 * Zod schema for login form submission.
 * Validates credentials before initiating 2-Step OTP challenge.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .max(255, 'Email address must not exceed 255 characters.')
    .email('Please provide a valid email address.')
    .regex(EMAIL_REGEX, 'Email address must be a valid format (e.g. user@example.com).'),
  password: z
    .string()
    .min(1, 'Password cannot be empty.')
    .max(128, 'Password must not exceed 128 characters.'),
});

/**
 * Zod schema for 6-digit OTP verification code.
 */
export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .min(1, 'OTP is required.')
    .length(6, 'OTP must be exactly 6 digits.')
    .regex(OTP_REGEX, 'OTP must contain numbers only.'),
});

/**
 * Zod schema for forgot password request.
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .max(255, 'Email address must not exceed 255 characters.')
    .email('Please provide a valid email address.')
    .regex(EMAIL_REGEX, 'Email address must be a valid format (e.g. user@example.com).'),
});

/**
 * Zod schema for password reset completion.
 */
export const resetPasswordSchema = z
  .object({
    otp: z
      .string()
      .trim()
      .min(1, 'OTP is required.')
      .length(6, 'OTP must be exactly 6 digits.')
      .regex(OTP_REGEX, 'OTP must contain numbers only.'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long.')
      .max(128, 'New password must not exceed 128 characters.')
      .regex(
        STRONG_PASSWORD_REGEX,
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
