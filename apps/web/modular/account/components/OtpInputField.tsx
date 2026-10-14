'use client';

import React from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';

export interface OtpInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: string;
  className?: string;
}

/**
 * Reusable 6-digit OTP Input component with structured groups and separators.
 */
export function OtpInputField({
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  error,
  className,
}: OtpInputFieldProps) {
  return (
    <div className={cn('w-full space-y-2', className)}>
      <div className="flex justify-center sm:justify-start">
        <InputOTP
          maxLength={6}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          containerClassName="w-full justify-between"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-destructive transition-all">
          {error}
        </p>
      )}
    </div>
  );
}
