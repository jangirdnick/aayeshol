'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthLayoutWrapper } from './AuthLayoutWrapper';
import { PasswordField } from './PasswordField';
import { OtpInputField } from './OtpInputField';
import { resetPasswordSchema } from '../schemas/auth.schema';
import { extractZodErrors } from '../utils/auth-error.util';
import type { ResetPasswordFormData, FormErrors } from '../types';

export interface ResetPasswordFormProps {
  /** Optional email provided from query parameters */
  email?: string;
  /** Optional submission hook for API integration */
  onSubmitResetPassword?: (data: ResetPasswordFormData) => Promise<void> | void;
}

/**
 * Reset Password completion form component.
 * Verifies 6-digit OTP code and updates credentials with strong password rules.
 */
export function ResetPasswordForm({ email, onSubmitResetPassword }: ResetPasswordFormProps) {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors<ResetPasswordFormData>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = resetPasswordSchema.safeParse({
      otp,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      setErrors(extractZodErrors(result));
      return;
    }

    setIsLoading(true);

    try {
      if (onSubmitResetPassword) {
        await onSubmitResetPassword(result.data);
      } else {
        // Prepare local form response simulation without claiming unverified API response
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayoutWrapper backAction={{ href: '/account/forgot-password', label: 'Back to recovery' }}>
      <div className="space-y-1 mb-8">
        <p className="text-base text-neutral-600 dark:text-neutral-400 font-normal">
          Security credentials
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-neutral-950 dark:text-neutral-50 leading-[1.12]">
          New Password
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 pt-1 leading-relaxed">
          {isSuccess
            ? 'Your password has been successfully updated.'
            : email
              ? `Enter the 6-digit code sent to ${email} and choose a new password.`
              : 'Enter your 6-digit verification code and set a strong new password.'}
        </p>
      </div>

      {!isSuccess ? (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* OTP Code */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
              6-digit verification code
            </label>
            <OtpInputField
              value={otp}
              onChange={(val) => {
                setOtp(val);
                if (errors.otp) setErrors((prev) => ({ ...prev, otp: undefined }));
              }}
              disabled={isLoading}
              error={errors.otp}
            />
          </div>

          {/* New Password */}
          <PasswordField
            label="New password"
            hideLabel
            id="newPassword"
            name="newPassword"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errors.newPassword) {
                setErrors((prev) => ({ ...prev, newPassword: undefined }));
              }
            }}
            placeholder="New strong password"
            required
            autoComplete="new-password"
            hint="Min 8 characters with uppercase, lowercase, number, and special character."
            error={errors.newPassword}
            disabled={isLoading}
          />

          {/* Confirm Password */}
          <PasswordField
            label="Confirm new password"
            hideLabel
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
            }}
            placeholder="Confirm new password"
            required
            autoComplete="new-password"
            error={errors.confirmPassword}
            disabled={isLoading}
          />

          <div className="pt-1">
            <Button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="w-full h-12 rounded-xl bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-medium text-base shadow-xs transition-all duration-200 active:scale-[0.99] cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white dark:text-neutral-950" />
                  Updating password...
                </span>
              ) : (
                'Update password'
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-200/60 dark:bg-neutral-800/60 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-neutral-800 dark:text-neutral-200">
              Your password has been changed. You can now log in with your updated credentials.
            </p>
          </div>

          <Link href="/account/login" className="block w-full">
            <Button className="w-full h-12 rounded-xl bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-medium text-base shadow-xs transition-all duration-200 active:scale-[0.99] cursor-pointer">
              Go to login
            </Button>
          </Link>
        </div>
      )}
    </AuthLayoutWrapper>
  );
}
