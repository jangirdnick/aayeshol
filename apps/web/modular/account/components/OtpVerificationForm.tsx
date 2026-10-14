'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OtpInputField } from './OtpInputField';

export interface OtpVerificationFormProps {
  email: string;
  otp: string;
  onOtpChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isVerifying?: boolean;
  resendCooldown?: number;
  onResendOtp: () => void;
  onChangeEmail: () => void;
  error?: string;
  heading?: string;
  subheading?: string;
  submitButtonText?: string;
}

/**
 * Reusable, accessible 6-digit OTP verification form component.
 * Used for both Login 2FA and registration email verification.
 */
export function OtpVerificationForm({
  email,
  otp,
  onOtpChange,
  onSubmit,
  isVerifying = false,
  resendCooldown = 0,
  onResendOtp,
  onChangeEmail,
  error,
  heading = 'Enter OTP Code',
  subheading = 'Verify email',
  submitButtonText = 'Verify',
}: OtpVerificationFormProps) {
  return (
    <>
      <div className="space-y-2 mb-8">
        <p className="text-base text-neutral-600 dark:text-neutral-400 font-normal">{subheading}</p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-neutral-950 dark:text-neutral-50 leading-[1.12]">
          {heading}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 pt-1 leading-relaxed">
          We sent a 6-digit verification code to{' '}
          <span className="font-medium text-neutral-950 dark:text-neutral-100">
            {email || 'your email'}
          </span>
          .
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {/* 6-Digit Separate Box InputOTP */}
        <OtpInputField value={otp} onChange={onOtpChange} disabled={isVerifying} error={error} />

        {/* Verify Button */}
        <div className="pt-1">
          <Button
            type="submit"
            disabled={isVerifying || otp.length < 6}
            className="w-full h-12 rounded-xl bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-medium text-base shadow-xs transition-all duration-200 active:scale-[0.99] cursor-pointer disabled:opacity-40"
          >
            {isVerifying ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white dark:text-neutral-950" />
                Verifying...
              </span>
            ) : (
              submitButtonText
            )}
          </Button>
        </div>

        {/* Resend & Change Email Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <p className="font-normal">
            Didn&apos;t get the code?{' '}
            <button
              type="button"
              onClick={onResendOtp}
              disabled={resendCooldown > 0}
              className="text-neutral-950 dark:text-neutral-100 font-semibold underline underline-offset-4 hover:opacity-75 transition-opacity cursor-pointer disabled:opacity-50 disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </p>
          <button
            type="button"
            onClick={onChangeEmail}
            className="text-neutral-950 dark:text-neutral-100 hover:underline transition-all text-xs cursor-pointer"
          >
            Change email
          </button>
        </div>
      </form>
    </>
  );
}
