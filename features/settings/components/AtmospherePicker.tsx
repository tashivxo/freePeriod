'use client';

import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { ProjectorIcon } from '@/components/ui/icons/projector';
import {
  COLOR_BENDS_GOLD,
  COLOR_BENDS_PEACH,
  COLOR_BENDS_ROSE,
  type ColorBendsAtmosphere,
} from '@/lib/utils/brand-colors';
import { cn } from '@/lib/utils';
import { useColorBendsAtmosphere } from '@/providers/color-bends-atmosphere';
import { useT } from '@/providers/locale';
import { useZenMode } from '@/providers/zen-mode';
import type { CSSProperties } from 'react';

const ZEN_LOCK_ID = 'settings-background-zen-locked';
const HEADING_ID = 'settings-background-heading';

const OPTIONS: {
  value: ColorBendsAtmosphere;
  labelKey: 'settings.backgroundBrand' | 'settings.backgroundRainbow';
}[] = [
  { value: 'brand', labelKey: 'settings.backgroundBrand' },
  { value: 'rainbow', labelKey: 'settings.backgroundRainbow' },
];

const BRAND_SWATCH: CSSProperties = {
  backgroundImage: `linear-gradient(135deg, ${COLOR_BENDS_ROSE}, ${COLOR_BENDS_PEACH}, ${COLOR_BENDS_GOLD})`,
};

const RAINBOW_SWATCH: CSSProperties = {
  backgroundImage: [
    'linear-gradient(20deg, rgb(255 0 0 / 0.55), transparent 72%)',
    'linear-gradient(0deg, rgb(50 205 50 / 0.55), transparent 72%)',
    'linear-gradient(-20deg, rgb(0 80 255 / 0.55), transparent 72%)',
  ].join(', '),
};

export function AtmospherePicker() {
  const t = useT();
  const { zenMode } = useZenMode();
  const { resolvedAtmosphere, setAtmosphere } = useColorBendsAtmosphere();

  return (
    <div className="mb-6 rounded-xl border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <MotionSafeIcon icon={ProjectorIcon} size={20} className="mt-0.5 text-text-secondary" />
        <div className="min-w-0">
          <p
            id={HEADING_ID}
            className="text-sm font-body font-medium text-text-primary"
          >
            {t('settings.background')}
          </p>
          <p className="mt-1 text-sm font-body text-text-secondary">
            {t('settings.backgroundDescription')}
          </p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-labelledby={HEADING_ID}
        aria-describedby={zenMode ? ZEN_LOCK_ID : undefined}
        className={cn('mt-4 grid grid-cols-2 gap-3', zenMode && 'opacity-40')}
      >
        {OPTIONS.map(({ value, labelKey }) => {
          const selected = resolvedAtmosphere === value;
          return (
            <label
              key={value}
              className={cn(
                'flex min-h-11 cursor-pointer flex-col gap-2 rounded-lg border bg-background p-2 text-start transition-colors duration-200 motion-reduce:transition-none',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral/40',
                selected
                  ? 'border-coral ring-2 ring-coral/20'
                  : cn('border-border', !zenMode && 'hover:border-text-secondary/40'),
                zenMode && 'cursor-not-allowed',
              )}
            >
              <span
                data-testid={`atmosphere-swatch-${value}`}
                aria-hidden
                className="block h-16 rounded-md bg-background"
                style={value === 'brand' ? BRAND_SWATCH : RAINBOW_SWATCH}
              />
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-body text-text-primary">{t(labelKey)}</span>
                <input
                  type="radio"
                  name="fp-atmosphere"
                  value={value}
                  checked={selected}
                  disabled={zenMode}
                  onChange={() => {
                    if (!selected) setAtmosphere(value);
                  }}
                  className="size-4 shrink-0 accent-[var(--color-coral)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
                />
              </span>
            </label>
          );
        })}
      </div>

      {zenMode ? (
        <p id={ZEN_LOCK_ID} className="mt-3 text-sm font-body text-text-secondary">
          {t('settings.backgroundZenLocked')}
        </p>
      ) : null}
    </div>
  );
}
