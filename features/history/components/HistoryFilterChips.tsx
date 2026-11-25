'use client';

import { X } from 'lucide-react';

export type HistoryFilterChip = {
  key: string;
  label: string;
  ariaLabel: string;
  onRemove: () => void;
};

export function HistoryFilterChips({ chips }: { chips: HistoryFilterChip[] }) {
  if (chips.length === 0) return null;

  return (
    <div
      data-testid="history-filter-chips"
      className="flex gap-2 overflow-x-auto py-1"
    >
      {chips.map((chip) => (
        <div
          key={chip.key}
          className="inline-flex h-9 shrink-0 items-center rounded-full border-2 border-border bg-surface ps-3 font-body text-sm text-text-primary"
        >
          <span className="whitespace-nowrap">{chip.label}</span>
          <button
            type="button"
            aria-label={chip.ariaLabel}
            onClick={chip.onRemove}
            className="inline-flex h-11 min-h-11 w-11 min-w-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-coral/20"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
