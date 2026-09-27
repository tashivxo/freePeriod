'use client';

import type { Ref } from 'react';
import { XIcon } from '@/components/ui/icons/x';
import type { AnimatedIconHandle } from '@/components/ui/icons/types';
import { cn } from '@/lib/utils';

type ExportErrorAlertProps = {
  message: string;
  detail?: string | null;
  className?: string;
  iconRef?: Ref<AnimatedIconHandle>;
  iconAnimationDisabled?: boolean;
};

/** Coral alert: a short teacher line, with optional muted technical details. */
export function ExportErrorAlert({
  message,
  detail,
  className,
  iconRef,
  iconAnimationDisabled,
}: ExportErrorAlertProps) {
  return (
    <div role="alert" className={cn('flex gap-3 rounded-xl bg-error/10 p-3 text-error', className)}>
      <XIcon
        ref={iconRef}
        size={24}
        animationDisabled={iconAnimationDisabled}
        aria-hidden
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0">
        <p className="font-body text-sm text-error">{message}</p>
        {detail ? (
          <details className="mt-1.5">
            <summary className="cursor-pointer font-body text-xs text-error/70">Details</summary>
            <p className="mt-1 whitespace-pre-wrap font-body text-xs leading-relaxed text-error/80">
              {detail}
            </p>
          </details>
        ) : null}
      </div>
    </div>
  );
}
