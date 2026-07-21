'use client';

import { cn } from '@/lib/utils';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import type { AnimatedIconComponent } from '@/components/icons/types';

type MotionSafeIconProps = {
  icon: AnimatedIconComponent;
  size?: number;
  className?: string;
};

export function MotionSafeIcon({ icon: Icon, size, className }: MotionSafeIconProps) {
  const ref = useMotionSafeIconRef();
  return (
    <Icon
      ref={ref}
      size={size}
      className={cn('inline-flex shrink-0 items-center text-current', className)}
    />
  );
}
