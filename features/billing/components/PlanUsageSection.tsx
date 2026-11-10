'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { useLocale, useT } from '@/providers/locale';
import { priceForInterval } from '@/features/billing/plan-prices';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types';
import type { BillingInterval } from '@/types';

const PLAN_NAME_KEYS: Record<Plan, 'settings.planFree' | 'settings.planPro' | 'settings.planProPlus'> = {
  free: 'settings.planFree',
  pro: 'settings.planPro',
  pro_plus: 'settings.planProPlus',
};

const UPGRADE_FEATURE_KEYS = {
  pro: ['settings.planUsage.proFeature1', 'settings.planUsage.proFeature2', 'settings.planUsage.proFeature3'] as const,
  pro_plus: [
    'settings.planUsage.proPlusFeature1',
    'settings.planUsage.proPlusFeature2',
    'settings.planUsage.proPlusFeature3',
  ] as const,
};

function formatMoney(locale: string, amount: number): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatResetDate(locale: string, iso: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export type PlanUsageSectionProps = {
  plan: Plan;
  isAdmin?: boolean;
  generationCount: number;
  generationLimit: number | null;
  trialDays?: number | null;
  billingInterval?: BillingInterval | null;
  usageResetsAt?: string | null;
  manageSubscriptionUrl?: string | null;
};

export function PlanUsageSection({
  plan,
  isAdmin = false,
  generationCount,
  generationLimit,
  trialDays = null,
  billingInterval = null,
  usageResetsAt = null,
  manageSubscriptionUrl = null,
}: PlanUsageSectionProps) {
  const t = useT();
  const { locale } = useLocale();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const effectiveTop = isAdmin ? 'pro_plus' : plan;
  const showUpgradeTile = effectiveTop === 'free' || effectiveTop === 'pro';
  const upgradeTarget: 'pro' | 'pro_plus' = effectiveTop === 'free' ? 'pro' : 'pro_plus';

  const priceInterval: 'monthly' | 'yearly' =
    billingInterval === 'yearly' ? 'yearly' : 'monthly';

  const currentPrice =
    effectiveTop === 'free'
      ? 0
      : priceForInterval(effectiveTop, priceInterval);
  const upgradePrice = priceForInterval(upgradeTarget, 'monthly');

  const nearLimit =
    generationLimit !== null && generationLimit > 0 && generationCount / generationLimit >= 0.9;

  const upgradeReasonKey =
    upgradeTarget === 'pro'
      ? nearLimit
        ? 'settings.planUsage.reasonNearLimit'
        : 'settings.planUsage.reasonRecommended'
      : 'settings.planUsage.reasonProPlus';

  const usagePercent =
    generationLimit !== null && generationLimit > 0
      ? Math.min(100, Math.round((generationCount / generationLimit) * 100))
      : 0;

  const planName = t(PLAN_NAME_KEYS[effectiveTop]);
  const trialSuffix =
    trialDays != null
      ? t(trialDays === 1 ? 'settings.planWithTrialOne' : 'settings.planWithTrial', {
          plan: planName,
          days: String(trialDays),
        })
      : null;

  const currentPriceLabel =
    effectiveTop === 'free'
      ? t('pricing.freePrice')
      : `${formatMoney(locale, currentPrice)}${t('pricing.perMonth')}`;

  const handleUpgrade = useCallback(async () => {
    if (loadingRef.current) return;
    setCheckoutError(null);

    if (effectiveTop === 'free') {
      loadingRef.current = true;
      setCheckoutLoading(true);
      try {
        const res = await fetch('/api/checkout?plan=pro&interval=monthly', { method: 'POST' });
        const data = (await res.json()) as { url?: string; error?: string };
        if (data.url) {
          window.location.assign(data.url);
          return;
        }
        setCheckoutError(data.error ?? t('pricing.checkoutError'));
      } catch {
        setCheckoutError(t('pricing.checkoutError'));
      } finally {
        loadingRef.current = false;
        setCheckoutLoading(false);
      }
      return;
    }

    if (manageSubscriptionUrl) {
      window.location.assign(manageSubscriptionUrl);
      return;
    }
    window.location.assign('/pricing');
  }, [effectiveTop, manageSubscriptionUrl, t]);

  const adjustPlanHref = manageSubscriptionUrl ?? '/pricing';
  const adjustPlanExternal = Boolean(manageSubscriptionUrl);

  return (
    <section
      id="billing"
      aria-labelledby="plan-usage-heading"
      className="scroll-mt-24 mt-4 rounded-2xl border border-border bg-surface p-6 md:p-8"
    >
      <h2
        id="plan-usage-heading"
        className="mb-4 font-display text-lg font-semibold text-text-primary"
      >
        {t('settings.planUsage.title')}
      </h2>

      <div
        className={cn(
          'grid gap-4',
          showUpgradeTile ? 'md:grid-cols-2' : 'grid-cols-1',
        )}
      >
        <div className="rounded-xl border border-border bg-background p-4 md:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            {t('settings.planUsage.currentPlanEyebrow')}
          </p>
          <p className="mt-2 font-display text-xl font-bold text-text-primary">{planName}</p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums text-text-primary">
            {currentPriceLabel}
          </p>
          {trialSuffix && (
            <p className="mt-2 text-sm text-text-secondary">{trialSuffix}</p>
          )}
          {usageResetsAt && (
            <p className="mt-2 text-sm text-text-secondary">
              {t('settings.planUsage.resetsOn', {
                date: formatResetDate(locale, usageResetsAt),
              })}
            </p>
          )}
          {adjustPlanExternal ? (
            <a
              href={adjustPlanHref}
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline' }), 'mt-4 w-full min-h-11')}
            >
              {t('settings.planUsage.adjustPlan')}
            </a>
          ) : (
            <Link
              href={adjustPlanHref}
              className={cn(buttonVariants({ variant: 'outline' }), 'mt-4 w-full min-h-11')}
            >
              {t('settings.planUsage.adjustPlan')}
            </Link>
          )}
        </div>

        {showUpgradeTile && (
          <div className="rounded-xl bg-coral/10 p-4 ring-1 ring-coral/30 md:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              {t('settings.planUsage.upgradeAvailableEyebrow')}
            </p>
            <p className="mt-2 font-display text-xl font-bold text-text-primary">
              {t(PLAN_NAME_KEYS[upgradeTarget])}
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-1">
              <span className="font-display text-3xl font-bold tabular-nums text-text-primary">
                {formatMoney(locale, upgradePrice)}
              </span>
              <span className="text-sm text-text-secondary">{t('pricing.perMonth')}</span>
            </div>
            <p className="mt-3 text-sm text-text-secondary">{t(upgradeReasonKey)}</p>
            <ul className="mt-4 space-y-2">
              {UPGRADE_FEATURE_KEYS[upgradeTarget].map((key) => (
                <li key={key} className="flex items-start gap-2.5 text-sm text-text-primary">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral/15">
                    <Check size={12} className="text-coral" aria-hidden />
                  </span>
                  {t(key)}
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2">
              <Button
                type="button"
                className="w-full min-h-11"
                isLoading={checkoutLoading}
                onClick={() => void handleUpgrade()}
              >
                {checkoutLoading ? t('pricing.checkoutRedirecting') : t('settings.planUsage.upgradeNow')}
              </Button>
              <Link
                href="/pricing"
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full min-h-11')}
              >
                {t('settings.planUsage.comparePlans')}
              </Link>
            </div>
            {checkoutError && (
              <FieldError variant="banner" className="mt-3" message={checkoutError} />
            )}
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
          <span className="font-medium text-text-primary">{t('settings.planUsage.lessonPlans')}</span>
          <span className="text-text-secondary tabular-nums">
            {generationLimit === null
              ? t('settings.usageUnlimited', { used: String(generationCount) })
              : t('settings.usageThisPeriod', {
                  used: String(generationCount),
                  limit: String(generationLimit),
                })}
          </span>
        </div>
        {generationLimit !== null && (
          <div
            className="h-2 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={generationCount}
            aria-valuemin={0}
            aria-valuemax={generationLimit}
            aria-label={t('settings.planUsage.usageBarAria')}
          >
            <div
              className="h-full rounded-full bg-coral transition-[width] duration-200"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
