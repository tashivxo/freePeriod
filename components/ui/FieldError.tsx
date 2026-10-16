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
}: {
  id?: string;
  message: string;
  className?: string;
  size?: number;
}) {
  const { ref, animationDisabled } = useMotionSafeIconRef();

  useEffect(() => {
    if (!message || animationDisabled) return;
    ref.current?.startAnimation();
  }, [message, animationDisabled, ref]);

  return (
    <div
      id={id}
      role="alert"
      className={cn('mt-1 flex items-start gap-2 text-sm font-body text-error', className)}
    >
      <XIcon
        ref={ref}
        size={size}
        animationDisabled={animationDisabled}
        aria-hidden
        className="mt-0.5 shrink-0"
      />
      <p>{message}</p>
    </div>
  );
}
