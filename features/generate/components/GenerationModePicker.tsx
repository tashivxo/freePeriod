'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Zap } from 'lucide-react';
import { AnimatedDropdown, type DropdownItem } from '@/components/ui/animated-dropdown';
import { LockIcon } from '@/components/ui/icons/lock';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { UpgradePrompt } from '@/features/billing/components/UpgradePrompt';
import { useT } from '@/providers/locale';

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

export function GenerationModePicker({
  id,
  value,
  onChange,
  qualityUnlocked,
}: GenerationModePickerProps) {
  const t = useT();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const selected =
    GENERATION_MODE_OPTIONS.find((option) => option.value === value) ??
    GENERATION_MODE_OPTIONS[0];

  const selectedLabel = selected.value === 'fast' ? t('generate.modeFast') : t('generate.modeQuality');
  const selectedDescription =
    selected.value === 'fast' ? t('generate.modeFastDescription') : t('generate.modeQualityDescription');

  const items = useMemo<DropdownItem[]>(
    () =>
      GENERATION_MODE_OPTIONS.map((option) => {
        const label = option.value === 'fast' ? t('generate.modeFast') : t('generate.modeQuality');
        const description =
          option.value === 'fast'
            ? t('generate.modeFastDescription')
            : t('generate.modeQualityDescription');
        return {
          name: label,
          value: option.value,
          description,
          disabled: option.value === 'quality' && !qualityUnlocked,
          icon:
            option.value === 'quality' && !qualityUnlocked ? (
              <span data-testid="quality-lock-icon" className="inline-flex items-center gap-1 text-coral">
                <MotionSafeIcon icon={LockIcon} size={15} />
                <span className="sr-only">{t('generate.qualityProOnly')}</span>
              </span>
            ) : undefined,
        };
      }),
    [qualityUnlocked, t],
  );

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
        text={t('generate.selectMode')}
        items={items}
        selectedValue={value}
        onSelect={handleSelect}
        onDisabledSelect={qualityUnlocked ? undefined : handleDisabledSelect}
        triggerAriaLabel={t('generate.modeAria', {
          label: selectedLabel,
          description: selectedDescription,
        })}
      />
      <p className="mt-1.5 text-sm font-body text-text-secondary">{selectedDescription}</p>

      {!qualityUnlocked && (
        <p className="mt-2 text-sm font-body text-text-secondary">
          <Link href="/pricing" className="text-coral underline-offset-2 hover:underline">
            {t('generate.upgradeToPro')}
          </Link>{' '}
          {t('generate.unlockQuality')}
        </p>
      )}

      {!qualityUnlocked && (
        <UpgradePrompt
          open={showUpgrade}
          onDismiss={() => setShowUpgrade(false)}
          message={t('generate.qualityUpgradeMessage')}
          upgradeHref="/pricing"
        />
      )}
    </div>
  );
}
