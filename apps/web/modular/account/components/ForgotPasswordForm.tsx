'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthLayoutWrapper } from './AuthLayoutWrapper';
import { AuthFormField } from './AuthFormField';
import { forgotPasswordSchema } from '../schemas/auth.schema';
import { extractZodErrors } from '../utils/auth-error.util';
import type { ForgotPasswordFormData, FormErrors } from '../types';

export interface ForgotPasswordFormProps {
  /** Optional submission hook for API integration */
  onSubmitEmail?: (data: ForgotPasswordFormData) => Promise<void> | void;
}

/**
 * Self-service Forgot Password initiation form component.
 */
export function ForgotPasswordForm({ onSubmitEmail }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors<ForgotPasswordFormData>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setErrors(extractZodErrors(result));
      return;
    }

    setIsLoading(true);

    try {
      if (onSubmitEmail) {
        await onSubmitEmail(result.data);
      } else {
        // Prepare local submission state without claiming unverified API response
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayoutWrapper backAction={{ href: '/account/login', label: 'Back to login' }}>
      <div className="space-y-1 mb-8">
        <p className="text-base text-neutral-600 dark:text-neutral-400 font-normal">
          Password recovery
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-neutral-950 dark:text-neutral-50 leading-[1.12]">
          Reset Password
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 pt-1 leading-relaxed">
          {isSubmitted
            ? `If an account is associated with ${email}, a 6-digit recovery OTP will be delivered.`
            : 'Enter the email associated with your account to receive a one-time verification code.'}
        </p>
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <AuthFormField
            label="Enter email"
            hideLabel
            id="forgot-email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            placeholder="Enter your registered email"
            required
            autoComplete="email"
            error={errors.email}
            disabled={isLoading}
          />

          <div className="pt-1">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-medium text-base shadow-xs transition-all duration-200 active:scale-[0.99] cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white dark:text-neutral-950" />
                  Sending code...
                </span>
              ) : (
                'Send verification code'
              )}
            </Button>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <p>
              Remember your password?{' '}
              <Link
                href="/account/login"
                className="text-neutral-950 dark:text-neutral-100 font-medium hover:underline transition-all"
              >
                Log in
              </Link>
            </p>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <Link
            href={`/account/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
            className="block w-full"
          >
            <Button className="w-full h-12 rounded-xl bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-medium text-base shadow-xs transition-all duration-200 active:scale-[0.99] cursor-pointer">
              Enter recovery code & reset
            </Button>
          </Link>
          <div className="text-center text-xs text-neutral-600 dark:text-neutral-400 pt-1">
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="text-neutral-950 dark:text-neutral-100 font-medium hover:underline transition-all cursor-pointer"
            >
              Try another email
            </button>
          </div>
        </div>
      )}
    </AuthLayoutWrapper>
  );
}
