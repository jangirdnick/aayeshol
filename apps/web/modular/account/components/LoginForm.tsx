'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthLayoutWrapper } from './AuthLayoutWrapper';
import { AuthFormField } from './AuthFormField';
import { PasswordField } from './PasswordField';
import { OtpVerificationForm } from './OtpVerificationForm';
import { loginSchema, verifyOtpSchema } from '../schemas/auth.schema';
import { extractZodErrors } from '../utils/auth-error.util';
import { useLoginMutation } from '../hooks/use-login-mutation';
import { useVerifyLoginOtpMutation } from '../hooks/use-verify-login-otp-mutation';
import type { LoginStep, FormErrors, LoginFormData } from '../types';

export interface LoginFormProps {
  /** Optional initial step */
  initialStep?: LoginStep;
  /** Optional initial email value */
  initialEmail?: string;
  /** Optional external submission hook for Step 1 credentials */
  onSubmitCredentials?: (data: LoginFormData) => Promise<void> | void;
  /** Optional external submission hook for Step 2 OTP */
  onSubmitOtp?: (data: { email: string; otp: string }) => Promise<void> | void;
}

/**
 * Modular 2-Step Login Form component.
 * Preserves the original visual identity, animations, and step transition
 * while enforcing strict Zod validation, TanStack Query mutations, and Zustand session synchronization.
 */
export function LoginForm({
  initialStep = 'credentials',
  initialEmail = '',
  onSubmitCredentials,
  onSubmitOtp,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [step, setStep] = useState<LoginStep>(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // TanStack Query mutations
  const loginMutation = useLoginMutation();
  const verifyOtpMutation = useVerifyLoginOtpMutation();

  const isLoading = loginMutation.isPending;
  const isVerifying = verifyOtpMutation.isPending;

  // Field-level error messages
  const [credentialErrors, setCredentialErrors] = useState<FormErrors<LoginFormData>>({});
  const [otpError, setOtpError] = useState<string | undefined>();

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCredentialErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setCredentialErrors(extractZodErrors(result));
      return;
    }

    try {
      if (onSubmitCredentials) {
        await onSubmitCredentials(result.data);
        setStep('otp');
        setResendCooldown(30);
      } else {
        const res = await loginMutation.mutateAsync(result.data);
        if (res.success && res.data?.challengeId) {
          setChallengeId(res.data.challengeId);
          setStep('otp');
          setResendCooldown(30);
        } else {
          setCredentialErrors({
            root: res.message || 'Login failed. Please check your credentials.',
          });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      setCredentialErrors({ root: message });
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOtpError(undefined);

    const result = verifyOtpSchema.safeParse({ otp });
    if (!result.success) {
      const errors = extractZodErrors(result);
      setOtpError(errors.otp || 'Please enter a valid 6-digit OTP code.');
      return;
    }

    try {
      if (onSubmitOtp) {
        await onSubmitOtp({ email, otp });
      } else {
        if (!challengeId) {
          setOtpError('Session challenge expired. Please re-enter your credentials.');
          setStep('credentials');
          return;
        }

        const res = await verifyOtpMutation.mutateAsync({ challengeId, otp });
        if (res.success) {
          router.push(redirectUrl);
        } else {
          setOtpError(res.message || 'Invalid or expired OTP code.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to verify OTP code.';
      setOtpError(message);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !email || !password) return;
    try {
      const res = await loginMutation.mutateAsync({ email, password });
      if (res.success && res.data?.challengeId) {
        setChallengeId(res.data.challengeId);
        setResendCooldown(30);
        setOtpError(undefined);
      } else {
        setOtpError(res.message || 'Failed to resend code.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend verification code.';
      setOtpError(message);
    }
  };

  return (
    <AuthLayoutWrapper
      backAction={
        step === 'otp'
          ? {
              onClick: () => {
                setStep('credentials');
                setOtp('');
                setOtpError(undefined);
              },
              label: 'Back to login',
            }
          : undefined
      }
    >
      {step === 'credentials' ? (
        /* ================= STEP 1: LOGIN (EMAIL & PASSWORD) ================= */
        <>
          <div className="space-y-1 mb-8">
            <p className="text-base text-neutral-600 dark:text-neutral-400 font-normal">Login to</p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-neutral-950 dark:text-neutral-50 leading-[1.12]">
              Where Knowledge <br />
              Comes Alive
            </h1>
          </div>

          {credentialErrors.root && (
            <div
              className="p-3.5 mb-4 text-sm rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium"
              role="alert"
            >
              {credentialErrors.root}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <AuthFormField
              label="Enter email"
              hideLabel
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (credentialErrors.email || credentialErrors.root) {
                  setCredentialErrors((prev) => ({ ...prev, email: undefined, root: undefined }));
                }
              }}
              placeholder="Enter email"
              required
              autoComplete="email"
              error={credentialErrors.email}
              disabled={isLoading}
            />

            {/* Password Field */}
            <PasswordField
              label="Enter password"
              hideLabel
              id="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (credentialErrors.password || credentialErrors.root) {
                  setCredentialErrors((prev) => ({
                    ...prev,
                    password: undefined,
                    root: undefined,
                  }));
                }
              }}
              placeholder="Enter password"
              required
              autoComplete="current-password"
              error={credentialErrors.password}
              disabled={isLoading}
            />

            {/* Submit Button */}
            <div className="pt-1">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-medium text-base shadow-xs transition-all duration-200 active:scale-[0.99] cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white dark:text-neutral-950" />
                    Signing in...
                  </span>
                ) : (
                  'Log in'
                )}
              </Button>
            </div>

            {/* Links */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <p className="font-normal text-xs">
                Have you lost your password?{' '}
                <Link
                  href="/account/forgot-password"
                  className="text-neutral-950 dark:text-neutral-100 font-medium hover:underline transition-all"
                >
                  Forgot password
                </Link>
              </p>
            </div>
          </form>
        </>
      ) : (
        /* ================= STEP 2: EMAIL OTP VERIFICATION ================= */
        <OtpVerificationForm
          email={email}
          otp={otp}
          onOtpChange={(val) => {
            setOtp(val);
            if (otpError) setOtpError(undefined);
          }}
          onSubmit={handleOtpSubmit}
          isVerifying={isVerifying}
          resendCooldown={resendCooldown}
          onResendOtp={handleResendOtp}
          onChangeEmail={() => {
            setStep('credentials');
            setOtp('');
            setOtpError(undefined);
          }}
          error={otpError}
        />
      )}
    </AuthLayoutWrapper>
  );
}
