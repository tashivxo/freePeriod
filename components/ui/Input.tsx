'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', onFocus, onBlur, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  const hasValue = props.value !== undefined && props.value !== '';

  return (
    <div className={['relative', className].filter(Boolean).join(' ')}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={[
          'peer w-full h-13 px-4 pt-5 pb-1 text-base font-body rounded-xl border-2 bg-surface text-text-primary',
          'transition-colors duration-150 outline-none',
          'placeholder-transparent',
          error
            ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
            : 'border-text-secondary/30 focus:border-coral focus:ring-2 focus:ring-coral/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
        placeholder={label}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      <label
        htmlFor={inputId}
        className={[
          'absolute left-4 transition-all duration-150 pointer-events-none font-body',
          focused || hasValue
            ? 'top-1.5 text-xs'
            : 'top-1/2 -translate-y-1/2 text-base',
          error ? 'text-error' : focused ? 'text-coral' : 'text-text-secondary',
        ].join(' ')}
      >
        {label}
      </label>
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="mt-1 text-sm text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
});
