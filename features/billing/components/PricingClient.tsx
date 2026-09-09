'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Check, Loader2 } from 'lucide-react';
import { BookTextIcon } from '@/components/ui/icons/book-text';
import { SparklesIcon } from '@/components/ui/icons/sparkles';
import { ZapIcon } from '@/components/ui/icons/zap';
import { CORAL, MUSTARD } from '@/lib/utils/brand-colors';
import { ThemeToggle } from '@/components/ui/branding/ThemeToggle';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import type { AnimatedIconComponent } from '@/components/ui/icons/types';
import { MagicCard } from '@/components/ui/effects/magic-card';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/legal/MarketingFooter';
import { TextSwap } from '@/components/ui/TextSwap';
import { createClient } from '@/lib/supabase/client';
import { XIcon } from '@/components/ui/icons/x';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import { useLocale, useT } from '@/providers/locale';

const SoftAurora = dynamic(
  () => import('@/components/ui/backgrounds/SoftAurora/SoftAurora'),
  { ssr: false },
);

type PlanId = 'free' | 'pro' | 'pro_plus';

interface PlanConfig {
  id: PlanId;
  Icon: AnimatedIconComponent;
  iconBg: string;
  priceMonthly: number;
  priceAnnual: number;
  ctaClass: string;
  href?: string;
  featured?: boolean;
}

const PLAN_FEATURE_KEYS: Record<PlanId, string[]> = {
  free: ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6'],
  pro: ['feature1', 'feature2', 'feature3', 'feature4', 'feature5'],
  pro_plus: ['feature1', 'feature2'],
};

const PLANS: PlanConfig[] = [
  {
    id: 'free',
    Icon: BookTextIcon,
    iconBg: 'bg-coral/10',
    priceMonthly: 0,
    priceAnnual: 0,
    ctaClass:
      'border border-coral text-coral hover:bg-coral/10 focus-visible:ring-2 focus-visible:ring-coral',
    href: '/sign-up',
  },
  {
    id: 'pro',
    Icon: SparklesIcon,
    iconBg: 'bg-coral/15',
    priceMonthly: 9,
    priceAnnual: 7,
    ctaClass:
      'bg-coral hover:bg-coral-dark text-white focus-visible:ring-2 focus-visible:ring-coral',
    featured: true,
  },
  {
    id: 'pro_plus',
    Icon: ZapIcon,
    iconBg: 'bg-coral/10',
    priceMonthly: 12,
    priceAnnual: 10,
    ctaClass:
      'bg-mustard hover:bg-mustard/90 text-text-primary focus-visible:ring-2 focus-visible:ring-mustard',
  },
];

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function formatMoney(locale: string, amount: number): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PricingClient() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutLongWait, setCheckoutLongWait] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion);
  const loadingPlanRef = useRef<string | null>(null);
  const { ref: checkoutErrorIconRef, animationDisabled: checkoutErrorIconMotionDisabled } =
    useMotionSafeIconRef();

  const compactHeadingTypography = locale === 'ar' || locale === 'zh-Hans';
  const headingTypographyClass = compactHeadingTypography
    ? 'tracking-normal leading-snug'
    : 'leading-[1.1] tracking-[-0.02em]';

  useEffect(() => {
    if (!checkoutError || checkoutErrorIconMotionDisabled) return;
    checkoutErrorIconRef.current?.startAnimation();
  }, [checkoutError, checkoutErrorIconMotionDisabled, checkoutErrorIconRef]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!loadingPlan) {
      setCheckoutLongWait(false);
      return;
    }
    setCheckoutLongWait(false);
    const timer = window.setTimeout(() => setCheckoutLongWait(true), 1500);
    return () => window.clearTimeout(timer);
  }, [loadingPlan]);

  const clearCheckoutLoading = useCallback(() => {
    loadingPlanRef.current = null;
    setLoadingPlan(null);
    setCheckoutLongWait(false);
  }, []);

  const handleCheckout = useCallback(
    async (planId: string) => {
      if (loadingPlanRef.current) return;

      loadingPlanRef.current = planId;
      setCheckoutError(null);
      setLoadingPlan(planId);

      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          clearCheckoutLoading();
          router.push(`/sign-up?plan=${planId}`);
          return;
        }

        const res = await fetch(
          `/api/checkout?plan=${planId}&interval=${isAnnual ? 'yearly' : 'monthly'}`,
          {
            method: 'POST',
          },
        );

        if (res.status === 401) {
          clearCheckoutLoading();
          router.push(`/sign-up?plan=${planId}`);
          return;
        }

        const data = (await res.json()) as { url?: string; error?: string };
        if (data.url) {
          window.location.assign(data.url);
          return;
        }

        setCheckoutError(data.error ?? t('pricing.checkoutError'));
        clearCheckoutLoading();
      } catch {
        setCheckoutError(t('pricing.checkoutError'));
        clearCheckoutLoading();
      }
    },
    [router, isAnnual, clearCheckoutLoading, t],
  );

  const handleBillingChange = useCallback((annual: boolean) => {
    setCheckoutError(null);
    setIsAnnual(annual);
  }, []);

  return (
    <div className="relative min-h-screen bg-background font-body">
      {/* Background aurora */}
      {!prefersReduced && (
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] overflow-hidden"
        aria-hidden="true"
      >
        <SoftAurora
          speed={0.3}
          scale={1.4}
          brightness={0.6}
          color1={CORAL}
          color2={MUSTARD}
          noiseFrequency={2.5}
          noiseAmplitude={1}
          bandHeight={0.5}
          bandSpread={1}
          octaveDecay={0.1}
          layerOffset={0}
          colorSpeed={1}
          enableMouseInteraction={false}
          mouseInfluence={0}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-background/45 to-background dark:from-background/40 dark:via-background/60 dark:to-background" />
      </div>
      )}

      <MarketingHeader navLink={{ href: '/', labelKey: 'landing.headerHome' }} />

      <main className="relative mx-auto max-w-5xl px-6 pb-24 pt-16">
        {/* Hero section */}
        <div className="mb-16 text-center">
          <TextSwap
            as="h1"
            swapKey={locale}
            className={`font-display text-4xl font-extrabold text-text-primary sm:text-5xl ${headingTypographyClass}`}
          >
            {t('pricing.title')}
          </TextSwap>

          <TextSwap
            as="p"
            swapKey={locale}
            className="mx-auto mt-4 max-w-xl font-body text-base leading-relaxed text-text-secondary sm:text-lg"
          >
            {t('pricing.subtitle')}
          </TextSwap>

          {/* Billing toggle */}
          <div
            role="tablist"
            aria-label={t('pricing.billingPeriodAria')}
            className="mt-8 inline-flex max-w-full flex-wrap items-center justify-center gap-3 rounded-2xl bg-surface p-1.5 shadow-sm ring-1 ring-border/50"
          >
            <button
              type="button"
              role="tab"
              id="billing-monthly"
              aria-selected={!isAnnual}
              aria-controls="pricing-plans"
              onClick={() => handleBillingChange(false)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral sm:px-5 ${
                !isAnnual
                  ? 'bg-coral text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('pricing.monthly')}
            </button>
            <button
              type="button"
              role="tab"
              id="billing-annual"
              aria-selected={isAnnual}
              aria-controls="pricing-plans"
              onClick={() => handleBillingChange(true)}
              className={`flex flex-wrap items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral sm:px-5 ${
                isAnnual
                  ? 'bg-coral text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('pricing.annual')}
              <span className="rounded-full bg-mustard/20 px-2 py-0.5 text-xs font-bold text-mustard-dark">
                {t('pricing.savePercent')}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div
          id="pricing-plans"
          role="tabpanel"
          aria-labelledby={isAnnual ? 'billing-annual' : 'billing-monthly'}
          className="grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {PLANS.map((plan) => {
            const { Icon } = plan;
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            const isActiveLoading = loadingPlan === plan.id;
            const isPaidCtaDisabled = loadingPlan !== null && !plan.href;
            const loadingLabel = checkoutLongWait
              ? t('pricing.checkoutSettingUp')
              : t('pricing.checkoutRedirecting');
            const planPrefix = `pricing.plans.${plan.id}`;
            const planName = t(`${planPrefix}.name`);
            const planDescription = t(`${planPrefix}.description`);
            const planCta = t(`${planPrefix}.cta`);
            const features = PLAN_FEATURE_KEYS[plan.id].map((key) =>
              t(`${planPrefix}.${key}`),
            );
            const formattedPrice = formatMoney(locale, price);
            const formattedYearly = formatMoney(locale, price * 12);

            return (
              <div
                key={plan.id}
                className={`relative ${plan.featured ? 'ring-2 ring-coral rounded-2xl' : ''}`}
              >
                {plan.featured && (
                  <div className="absolute -top-3.5 left-1/2 z-10 w-full max-w-[calc(100%-1rem)] -translate-x-1/2 text-center">
                    <span className="inline-block max-w-full rounded-full bg-coral px-3 py-1 text-xs font-bold leading-tight text-white shadow-sm">
                      {t('pricing.mostPopular')}
                    </span>
                  </div>
                )}

                <MagicCard
                  className={`h-full rounded-2xl p-6 ${plan.featured ? 'pt-8' : ''}`}
                  gradientColor={CORAL}
                  gradientOpacity={0.12}
                >
                  <div className="flex h-full flex-col">
                    {/* Plan icon + name */}
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg}`}
                      >
                        <MotionSafeIcon icon={Icon} size={20} className="text-coral" />
                      </div>
                      <h2
                        className={`font-display text-xl font-bold text-text-primary ${compactHeadingTypography ? 'tracking-normal leading-snug' : ''}`}
                      >
                        {planName}
                      </h2>
                    </div>

                    {/* Price */}
                    <div className="mb-2">
                      {price === 0 ? (
                        <span className="font-display text-4xl font-bold text-text-primary tabular-nums">
                          {t('pricing.freePrice')}
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-baseline gap-1">
                          <span className="font-display text-4xl font-bold text-text-primary tabular-nums">
                            {formattedPrice}
                          </span>
                          <span className="text-sm text-text-secondary tabular-nums">
                            {t('pricing.perMonth')}
                          </span>
                        </div>
                      )}
                      {isAnnual && price > 0 && (
                        <p className="mt-1 text-xs text-text-secondary tabular-nums">
                          {t('pricing.billedAnnually', { amount: formattedYearly })}
                        </p>
                      )}
                    </div>

                    <p className="mb-6 min-h-[4.5rem] text-pretty text-sm text-text-secondary">
                      {planDescription}
                    </p>

                    {/* Features */}
                    <ul className="flex-1 space-y-2.5">
                      {features.map((feature, index) => (
                        <li key={PLAN_FEATURE_KEYS[plan.id][index]} className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral/10">
                            <Check size={12} className="text-coral" />
                          </div>
                          <span className="text-sm text-text-secondary">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="mt-auto pt-6">
                      {plan.href ? (
                        <Link
                          href={plan.href}
                          className={`relative btn-shine overflow-hidden flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors min-h-[44px] focus-visible:outline-none ${plan.ctaClass}`}
                        >
                          {planCta}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCheckout(plan.id)}
                          disabled={isPaidCtaDisabled}
                          aria-busy={isActiveLoading}
                          className={`relative btn-shine overflow-hidden flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors min-h-[44px] focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${plan.ctaClass}`}
                        >
                          {isActiveLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                              <span className="leading-snug text-pretty" aria-live="polite">
                                {loadingLabel}
                              </span>
                            </>
                          ) : (
                            planCta
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </MagicCard>
              </div>
            );
          })}
        </div>

        {checkoutError ? (
          <div
            role="alert"
            className="mt-6 flex gap-3 rounded-xl bg-error/10 p-3 text-error"
          >
            <XIcon
              ref={checkoutErrorIconRef}
              size={24}
              animationDisabled={checkoutErrorIconMotionDisabled}
              aria-hidden
              className="mt-0.5 shrink-0"
            />
            <p className="font-body text-sm text-error">{checkoutError}</p>
          </div>
        ) : null}

        {/* Trust footer */}
        <p className="mt-12 text-center text-sm text-text-secondary">
          {t('pricing.trustFooter')}
        </p>
      </main>

      <MarketingFooter />

      <ThemeToggle variant="floating-label" wrapperClassName="fixed bottom-6 end-6 z-50" />
    </div>
  );
}
