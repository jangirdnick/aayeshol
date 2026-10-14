'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface AuthFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text for accessibility and visual display */
  label: string;
  /** Whether the label should be visually hidden (screen-reader only) */
  hideLabel?: boolean;
  /** Inline error message if validation fails */
  error?: string;
  /** Helpful auxiliary hint text below the input */
  hint?: string;
  /** Container wrapper class names */
  containerClassName?: string;
  /** Optional icon or element rendered inside the right end of the input */
  endAdornment?: React.ReactNode;
}

/**
 * Reusable, accessible, type-safe form field component for authentication forms.
 * Enforces correct aria-invalid, aria-describedby, and matching visual styling.
 */
export const AuthFormField = React.forwardRef<HTMLInputElement, AuthFormFieldProps>(
  (
    {
      id: customId,
      label,
      hideLabel = false,
      error,
      hint,
      className,
      containerClassName,
      endAdornment,
      required,
      disabled,
      ...inputProps
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const describedBy =
      [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium text-neutral-800 dark:text-neutral-200',
            hideLabel ? 'sr-only' : 'block',
          )}
        >
          {label}
          {required && !hideLabel && (
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              'w-full h-12 px-4 rounded-xl bg-neutral-200/90 dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 text-base border border-transparent focus:border-neutral-400 dark:focus:border-neutral-600 focus:bg-white dark:focus:bg-neutral-800 focus:ring-2 focus:ring-neutral-950 dark:focus:ring-white outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
              endAdornment && 'pr-11',
              error &&
                'border-destructive focus:border-destructive ring-1 ring-destructive/30 dark:border-destructive dark:focus:border-destructive',
              className,
            )}
            {...inputProps}
          />

          {endAdornment && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
              {endAdornment}
            </div>
          )}
        </div>

        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-destructive transition-all"
          >
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-xs text-neutral-500 dark:text-neutral-400">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

AuthFormField.displayName = 'AuthFormField';
