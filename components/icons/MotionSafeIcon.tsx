'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import type { AnimatedIconComponent } from '@/components/icons/types';

type MotionSafeIconProps = {
  icon: AnimatedIconComponent;
  size?: number;
  className?: string;
  /** Trigger icon animation when the parent interactive element receives focus (Navbar, ThemeToggle). */
  parentFocus?: boolean;
};

export function MotionSafeIcon({
  icon: Icon,
  size,
  className,
  parentFocus = false,
}: MotionSafeIconProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { ref, animationDisabled } = useMotionSafeIconRef();

  useEffect(() => {
    if (!parentFocus || animationDisabled) return;

    const parent = wrapperRef.current?.parentElement;
    if (!parent) return;

    const handleFocusIn = () => {
      ref.current?.startAnimation();
    };

    const handleFocusOut = (event: FocusEvent) => {
      if (!parent.contains(event.relatedTarget as Node | null)) {
        ref.current?.stopAnimation();
      }
    };

    parent.addEventListener('focusin', handleFocusIn);
    parent.addEventListener('focusout', handleFocusOut);
    return () => {
      parent.removeEventListener('focusin', handleFocusIn);
      parent.removeEventListener('focusout', handleFocusOut);
    };
  }, [animationDisabled, parentFocus, ref]);

  return (
    <div ref={wrapperRef} className="inline-flex shrink-0">
      <Icon
        ref={ref}
        size={size}
        animationDisabled={animationDisabled}
        aria-hidden
        className={cn('inline-flex shrink-0 items-center text-current', className)}
      />
    </div>
  );
}
