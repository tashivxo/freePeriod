'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import type { AnimatedIconComponent } from '@/components/ui/icons/types';

type MotionSafeIconProps = {
  icon: AnimatedIconComponent;
  size?: number;
  className?: string;
  /** Trigger icon animation when the parent interactive element receives focus (Navbar, ThemeToggle). */
  parentFocus?: boolean;
  /** Trigger icon animation when the parent interactive element is hovered (Navbar links). */
  parentHover?: boolean;
};

export function MotionSafeIcon({
  icon: Icon,
  size,
  className,
  parentFocus = false,
  parentHover = false,
}: MotionSafeIconProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { ref, animationDisabled } = useMotionSafeIconRef();

  useEffect(() => {
    if ((!parentFocus && !parentHover) || animationDisabled) return;

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

    const handleMouseEnter = () => {
      ref.current?.startAnimation();
    };

    const handleMouseLeave = () => {
      ref.current?.stopAnimation();
    };

    if (parentFocus) {
      parent.addEventListener('focusin', handleFocusIn);
      parent.addEventListener('focusout', handleFocusOut);
    }

    if (parentHover) {
      parent.addEventListener('mouseenter', handleMouseEnter);
      parent.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (parentFocus) {
        parent.removeEventListener('focusin', handleFocusIn);
        parent.removeEventListener('focusout', handleFocusOut);
      }
      if (parentHover) {
        parent.removeEventListener('mouseenter', handleMouseEnter);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [animationDisabled, parentFocus, parentHover, ref]);

  return (
    <div
      ref={wrapperRef}
      className={cn('inline-flex shrink-0', parentHover && 'pointer-events-none')}
    >
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
