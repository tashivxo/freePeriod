'use client';

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', onFocus, onBlur, endAdornment, ...props },
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
          'peer w-full h-13 px-4 pt-5 pb-1 text-base font-body rounded-xl border-2 bg-background text-text-primary',
          'transition-colors duration-150 outline-none',
          'placeholder-transparent',
          endAdornment ? 'pr-11' : '',
          error
            ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
            : 'border-coral/50 focus:border-coral focus:ring-2 focus:ring-coral/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].filter(Boolean).join(' ')}
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
          'absolute left-4 transition-[top,transform,font-size,color] duration-150 pointer-events-none font-body',
          focused || hasValue
            ? 'top-1.5 text-xs'
            : 'top-1/2 -translate-y-1/2 text-base',
          error ? 'text-error' : focused ? 'text-coral' : 'text-text-secondary',
        ].join(' ')}
      >
        {label}
      </label>
      {endAdornment && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center z-10">
          {endAdornment}
        </div>
      )}
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
