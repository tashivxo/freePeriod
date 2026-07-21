'use client';

import Link from 'next/link';
import { Sparkles, Zap } from 'lucide-react';
import { AnimatedDropdown, type DropdownItem } from '@/components/ui/animated-dropdown';

export type GenerationMode = 'fast' | 'quality';

export const GENERATION_MODE_OPTIONS = [
  {
    value: 'fast' as const,
    label: 'Fast',
    description: 'Quicker plans for everyday lessons.',
    Icon: Zap,
  },
  {
    value: 'quality' as const,
    label: 'Quality',
    description: 'More thorough plans. Takes a bit longer.',
    Icon: Sparkles,
  },
] as const;

type GenerationModePickerProps = {
  id: string;
  value: GenerationMode;
  onChange: (mode: GenerationMode) => void;
  qualityUnlocked: boolean;
};

function toDropdownItems(qualityUnlocked: boolean): DropdownItem[] {
  return GENERATION_MODE_OPTIONS.map((option) => ({
    name: option.label,
    value: option.value,
    description: option.description,
    disabled: option.value === 'quality' && !qualityUnlocked,
    badge: option.value === 'quality' && !qualityUnlocked ? 'Pro' : undefined,
  }));
}

export function GenerationModePicker({
  id,
  value,
  onChange,
  qualityUnlocked,
}: GenerationModePickerProps) {
  const selected =
    GENERATION_MODE_OPTIONS.find((option) => option.value === value) ??
    GENERATION_MODE_OPTIONS[0];

  const handleSelect = (item: DropdownItem) => {
    if (item.value === 'fast' || item.value === 'quality') {
      onChange(item.value);
    }
  };

  return (
    <div>
      <AnimatedDropdown
        id={id}
        text="Select generation mode"
        items={toDropdownItems(qualityUnlocked)}
        selectedValue={value}
        onSelect={handleSelect}
        triggerAriaLabel={`Generation mode: ${selected.label}. ${selected.description}`}
      />

      {!qualityUnlocked && (
        <p className="mt-2 text-sm font-body text-text-secondary">
          <Link href="/pricing" className="text-coral underline-offset-2 hover:underline">
            Upgrade to Pro
          </Link>{' '}
          to unlock Quality mode.
        </p>
      )}
    </div>
  );
}
