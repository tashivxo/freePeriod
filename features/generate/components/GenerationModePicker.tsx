'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Zap } from 'lucide-react';
import { AnimatedDropdown, type DropdownItem } from '@/components/ui/animated-dropdown';
import { LockIcon } from '@/components/ui/icons/lock';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';

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
    icon:
      option.value === 'quality' && !qualityUnlocked ? (
        <span data-testid="quality-lock-icon" className="inline-flex items-center gap-1 text-coral">
          <MotionSafeIcon icon={LockIcon} size={15} />
          <span className="sr-only">(Pro only)</span>
        </span>
      ) : undefined,
  }));
}

export function GenerationModePicker({
  id,
  value,
  onChange,
  qualityUnlocked,
}: GenerationModePickerProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const selected =
    GENERATION_MODE_OPTIONS.find((option) => option.value === value) ??
    GENERATION_MODE_OPTIONS[0];

  const handleSelect = (item: DropdownItem) => {
    if (item.value === 'fast' || item.value === 'quality') {
      onChange(item.value);
    }
  };

  const handleDisabledSelect = (item: DropdownItem) => {
    if (!qualityUnlocked && item.value === 'quality') {
      setShowUpgrade(true);
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
        onDisabledSelect={qualityUnlocked ? undefined : handleDisabledSelect}
        triggerAriaLabel={`Generation mode: ${selected.label}. ${selected.description}`}
      />
      <p className="mt-1.5 text-sm font-body text-text-secondary">{selected.description}</p>

      {!qualityUnlocked && (
        <p className="mt-2 text-sm font-body text-text-secondary">
          <Link href="/pricing" className="text-coral underline-offset-2 hover:underline">
            Upgrade to Pro
          </Link>{' '}
          to unlock Quality mode.
        </p>
      )}

      {!qualityUnlocked && (
        <UpgradePrompt
          open={showUpgrade}
          onDismiss={() => setShowUpgrade(false)}
          message="Quality mode is available on Pro and Pro+. Upgrade to unlock more thorough lesson plans."
          upgradeHref="/pricing"
        />
      )}
    </div>
  );
}
