import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type PendingStatusProps = {
  message: string;
  layout: 'inset' | 'overlay';
  className?: string;
};

/** Shared coral Loader2 pending state for dialogs and cards. */
export function PendingStatus({ message, layout, className }: PendingStatusProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        layout === 'overlay'
          ? 'absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-surface/90 backdrop-blur-[2px]'
          : 'flex min-h-[7.5rem] flex-col items-center justify-center gap-2',
        className,
      )}
    >
      <Loader2
        className="h-5 w-5 shrink-0 text-coral motion-safe:animate-spin"
        aria-hidden
      />
      {layout === 'overlay' ? (
        <span className="font-body text-sm text-text-secondary">{message}</span>
      ) : (
        <p className="font-body text-sm text-text-secondary text-center text-pretty">{message}</p>
      )}
    </div>
  );
}

export { PendingStatus as BusyStatusMessage };