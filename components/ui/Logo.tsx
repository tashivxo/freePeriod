'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { px: 28, text: 'text-base' },
  md: { px: 36, text: 'text-xl' },
  lg: { px: 48, text: 'text-3xl' },
} as const;

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const s = sizeMap[size];

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src="/brand/pictogram.png"
        alt={showText ? '' : 'FreePeriod'}
        aria-hidden={showText ? true : undefined}
        width={s.px}
        height={s.px}
        className="flex-shrink-0 rounded-full object-cover"
        priority={size === 'lg'}
      />

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
