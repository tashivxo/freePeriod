import { cn } from '@/lib/utils';

type RoundRadioIndicatorProps = {
  selected: boolean;
  className?: string;
};

/** Circular radio dot used in settings (Atmosphere) and auth consent rows. */
export function RoundRadioIndicator({ selected, className }: RoundRadioIndicatorProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-full border-2 bg-background',
        selected ? 'border-[#D94677] dark:border-coral' : 'border-text-secondary/50',
        className,
      )}
    >
      <span
        className={cn(
          'size-2 rounded-full transition-transform duration-200 motion-reduce:transition-none',
          selected ? 'scale-100 bg-[#D94677] dark:bg-coral' : 'scale-0 bg-coral',
        )}
      />
    </span>
  );
}
