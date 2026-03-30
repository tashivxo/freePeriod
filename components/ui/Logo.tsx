'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { pill: 'h-7 w-7', icon: 14, text: 'text-base' },
  md: { pill: 'h-9 w-9', icon: 18, text: 'text-xl' },
  lg: { pill: 'h-12 w-12', icon: 24, text: 'text-3xl' },
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const s = sizeMap[size];

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {/* Coral pill with mustard mug */}
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-xl bg-coral flex-shrink-0',
          s.pill
        )}
        aria-hidden="true"
      >
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Mug body */}
          <path
            d="M6 7h10l-1.5 10H7.5L6 7z"
            fill="#F7C34B"
            stroke="#F7C34B"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
          {/* Mug handle */}
          <path
            d="M16 9.5c2 0 3 0.8 3 2s-1 2-3 2"
            stroke="#F7C34B"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Steam left */}
          <path
            d="M9 5.5C9 4.5 10 4.5 10 3.5"
            stroke="#F7C34B"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Steam right */}
          <path
            d="M12 5.5C12 4.5 13 4.5 13 3.5"
            stroke="#F7C34B"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>

      {/* Brand name */}
      {showText && (
        <span
          className={cn(
            'font-display font-extrabold tracking-tight text-text-primary leading-none',
            s.text
          )}
        >
          FreePeriod
        </span>
      )}
    </span>
  );
}
