'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AuthFormField, type AuthFormFieldProps } from './AuthFormField';

export interface PasswordFieldProps extends Omit<AuthFormFieldProps, 'type' | 'endAdornment'> {
  /** Custom accessible label for toggling visibility */
  toggleLabel?: string;
}

/**
 * Reusable, type-safe password input component with show/hide password toggle.
 */
export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ toggleLabel, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <AuthFormField
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        endAdornment={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-neutral-600 dark:text-neutral-400 hover:text-foreground p-1 transition-colors cursor-pointer"
            aria-label={
              showPassword ? toggleLabel || 'Hide password' : toggleLabel || 'Show password'
            }
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        {...props}
      />
    );
  },
);

PasswordField.displayName = 'PasswordField';
