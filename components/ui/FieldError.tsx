'use client';

import { useEffect } from 'react';
import { XIcon } from '@/components/ui/icons/x';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import { cn } from '@/lib/utils';

export function FieldError({
  id,
  message,
  className,
  size = 16,
  variant = 'inline',
}: {
  id?: string;
  message: string;
  className?: string;
  size?: number;
  variant?: 'inline' | 'banner';
}) {
  const { ref, animationDisabled } = useMotionSafeIconRef();
  const iconSize = variant === 'banner' ? 24 : size;

  useEffect(() => {
    if (!message || animationDisabled) return;
    ref.current?.startAnimation();
  }, [message, animationDisabled, ref]);

  return (
    <div
      id={id}
      role="alert"
      className={cn(
        variant === 'banner'
          ? 'flex gap-3 rounded-xl bg-error/10 p-3 font-body text-sm text-error'
          : 'mt-1 flex items-start gap-2 text-sm font-body text-error',
        className,
      )}
    >
      <XIcon
        ref={ref}
        size={iconSize}
        animationDisabled={animationDisabled}
        aria-hidden
        className="mt-0.5 shrink-0"
      />
      <p>{message}</p>
    </div>
  );
}
