'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { PenToolIcon } from '@/components/ui/icons/pen-tool';
import { SparklesIcon } from '@/components/ui/icons/sparkles';
import { DownloadIcon } from '@/components/ui/icons/download';
import { BookTextIcon } from '@/components/ui/icons/book-text';
import { ClockIcon } from '@/components/ui/icons/clock';
import { ThemeToggle } from '@/components/ui/branding/ThemeToggle';
import { LanguagePicker } from '@/components/ui/LanguagePicker';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import type { AnimatedIconComponent } from '@/components/ui/icons/types';
import { animate, stagger } from 'animejs';
import { Logo } from '@/components/ui/branding/Logo';
import { MarketingFooter } from '@/components/legal/MarketingFooter';
import { ShinyText } from '@/components/ui/effects/ShinyText';
import { SpotlightCard } from '@/components/ui/effects/SpotlightCard';
import { CORAL, MUSTARD } from '@/lib/utils/brand-colors';
import { useT } from '@/providers/locale';
import dynamic from 'next/dynamic';

const HeroPictogram = dynamic(
  () => import('@/components/animations/HeroPictogram').then((m) => m.HeroPictogram),
  { ssr: false }
);

const SoftAurora = dynamic(
  () => import('@/components/ui/backgrounds/SoftAurora/SoftAurora'),
  { ssr: false }
);

const CtaIridescenceBackground = dynamic(
  () =>
    import('@/components/ui/backgrounds/CtaIridescenceBackground').then(
      (m) => m.CtaIridescenceBackground
    ),
  { ssr: false }
);

const LEAD_FEATURE = {
  icon: PenToolIcon,
  iconSize: 28,
  titleKey: 'landing.featureStructuredPlans',
  descriptionKey: 'landing.featureStructuredPlansDesc',
  color: 'bg-coral/10 text-coral',
} as const;

const SUPPORTING_FEATURES: {
  icon: AnimatedIconComponent;
  iconSize: number;
  titleKey: 'landing.featureAiPowered' | 'landing.featureExportAnywhere';
  descriptionKey: 'landing.featureAiPoweredDesc' | 'landing.featureExportAnywhereDesc';
  color: string;
}[] = [
  {
    icon: SparklesIcon,
    iconSize: 20,
    titleKey: 'landing.featureAiPowered',
    descriptionKey: 'landing.featureAiPoweredDesc',
    color: 'bg-mustard/20 text-mustard-dark',
  },
  {
    icon: DownloadIcon,
    iconSize: 20,
    titleKey: 'landing.featureExportAnywhere',
    descriptionKey: 'landing.featureExportAnywhereDesc',
    color: 'bg-coral/10 text-coral',
  },
];

const CONVERSION_POINTS: {
  icon: AnimatedIconComponent | typeof FileText;
  animated: boolean;
  iconSize: number;
  textKey: 'landing.conversionPoint1' | 'landing.conversionPoint2' | 'landing.conversionPoint3';
}[] = [
  {
    icon: FileText,
    animated: false,
    iconSize: 20,
    textKey: 'landing.conversionPoint1',
  },
  {
    icon: PenToolIcon,
    animated: true,
    iconSize: 20,
    textKey: 'landing.conversionPoint2',
  },
  {
    icon: BookTextIcon,
    animated: true,
    iconSize: 20,
    textKey: 'landing.conversionPoint3',
  },
];

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function HomePage() {
  const t = useT();
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion);
  const hiddenUntilAnimated = prefersReduced ? 1 : 0;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReduced) return;

    if (heroRef.current) {
      const targets = Array.from(heroRef.current.querySelectorAll('[data-animate]'));
      if (targets.length > 0) {
        animate(targets, {
          translateY: [20, 0],
          opacity: [0, 1],
          duration: 600,
          delay: stagger(100),
          easing: 'easeOutCubic',
        });
      }
    }

    if (toggleRef.current) {
      animate(toggleRef.current, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 600,
        delay: 1000,
        easing: 'easeOutCubic',
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = Array.from(entry.target.querySelectorAll('[data-feature]'));
            if (cards.length > 0) {
              animate(cards, {
                translateY: [24, 0],
                opacity: [0, 1],
                duration: 600,
                delay: stagger(80),
                easing: 'easeOutCubic',
              });
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => observer.disconnect();
  }, [prefersReduced]);

  const LeadIcon = LEAD_FEATURE.icon;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {!prefersReduced && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px]" aria-hidden="true">
          <SoftAurora
            speed={0.4}
            scale={1.5}
            brightness={0.8}
            color1={CORAL}
            color2={MUSTARD}
            noiseFrequency={2.5}
            noiseAmplitude={1}
            bandHeight={0.5}
            bandSpread={1}
            octaveDecay={0.1}
            layerOffset={0}
            colorSpeed={1}
            enableMouseInteraction={true}
            mouseInfluence={0.25}
          />
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Logo size="sm" />
          <nav className="flex items-center gap-2">
            <LanguagePicker variant="icon" />
            <Link
              href="/pricing"
              className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-body text-text-secondary transition-colors hover:text-text-primary"
            >
              {t('landing.headerPricing')}
            </Link>
            <Link
              href="/sign-in"
              className="relative btn-shine inline-flex min-h-11 items-center overflow-hidden rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
            >
              {t('landing.headerSignIn')}
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative">
        <section className="relative z-10 mx-auto max-w-5xl px-6 pt-14 pb-12 sm:pt-16 lg:pt-20 lg:pb-14">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-14">
            <div ref={heroRef} className="flex-1 text-center lg:text-left">
              <h1
                data-animate
                className="font-display text-4xl font-extrabold leading-[1.08] tracking-[-0.02em] text-text-primary sm:text-5xl lg:text-[3.25rem]"
                style={{ opacity: hiddenUntilAnimated }}
              >
                {t('landing.heroHeadline1')}{' '}
                <span className="relative whitespace-nowrap text-coral">
                  {t('landing.heroHeadlineHighlight')}
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    viewBox="0 0 200 8"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 6 Q50 2 100 5 Q150 8 198 3"
                      style={{ stroke: 'var(--color-coral)' }}
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.6"
                    />
                  </svg>
                </span>{' '}
                {t('landing.heroHeadline2')}
              </h1>

              <p
                data-animate
                className="mx-auto mt-5 max-w-lg font-body text-base leading-relaxed text-text-secondary sm:text-lg lg:mx-0"
                style={{ opacity: hiddenUntilAnimated }}
              >
                {t('landing.heroSub')}
              </p>

              <div
                data-animate
                className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start"
                style={{ opacity: hiddenUntilAnimated }}
              >
                <Link
                  href="/sign-up"
                  className="relative btn-shine inline-flex min-h-[44px] items-center gap-2 overflow-hidden rounded-xl bg-coral px-6 py-3 font-body text-sm font-semibold text-white shadow-sm transition-colors hover:bg-coral-dark"
                >
                  {t('landing.heroCtaPrimary')}
                </Link>
                <Link
                  href="/sign-in"
                  className="relative btn-shine inline-flex min-h-[44px] items-center gap-2 overflow-hidden rounded-xl border border-border bg-surface px-6 py-3 font-body text-sm font-medium text-text-primary transition-colors hover:bg-muted dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                >
                  {t('landing.heroCtaSecondary')}
                </Link>
              </div>

              <div
                data-animate
                className="mt-5 flex items-center justify-center gap-4 lg:justify-start"
                style={{ opacity: hiddenUntilAnimated }}
              >
                <div className="flex items-center gap-1.5 text-xs font-body text-text-secondary">
                  <MotionSafeIcon icon={ClockIcon} size={14} />
                  {t('landing.heroStatTime')}
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1.5 text-xs font-body text-text-secondary">
                  <MotionSafeIcon icon={BookTextIcon} size={14} />
                  {t('landing.heroStatFree')}
                </div>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center justify-center">
              <HeroPictogram />
            </div>
          </div>
        </section>

        <section
          id="features"
          ref={featuresRef}
          className="relative z-10 mx-auto max-w-5xl px-6 py-16 md:py-20"
        >
          <div className="mb-10 text-center md:mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
              <ShinyText text={t('landing.featuresTitle')} speed={8} />
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-body text-sm text-text-secondary md:text-base">
              {t('landing.featuresSub')}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 lg:grid-rows-2 lg:gap-6">
            <SpotlightCard
              data-feature
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface/50 p-7 backdrop-blur transition-colors hover:border-coral/50 lg:row-span-2 lg:p-9"
            >
              <div className={`mb-5 inline-flex rounded-xl p-3.5 ${LEAD_FEATURE.color}`}>
                <MotionSafeIcon icon={LeadIcon} size={LEAD_FEATURE.iconSize} />
              </div>
              <h3 className="mb-3 font-display text-2xl font-semibold text-text-primary">
                {t(LEAD_FEATURE.titleKey)}
              </h3>
              <p className="max-w-md font-body text-sm leading-relaxed text-text-secondary md:text-base">
                {t(LEAD_FEATURE.descriptionKey)}
              </p>
            </SpotlightCard>

            {SUPPORTING_FEATURES.map(({ icon, iconSize, titleKey, descriptionKey, color }) => (
              <SpotlightCard
                key={titleKey}
                data-feature
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface/50 p-6 backdrop-blur transition-colors hover:border-coral/50 md:p-7"
              >
                <div className={`mb-4 inline-flex rounded-xl p-3 ${color}`}>
                  <MotionSafeIcon icon={icon} size={iconSize} />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">{t(titleKey)}</h3>
                <p className="font-body text-sm leading-relaxed text-text-secondary">{t(descriptionKey)}</p>
              </SpotlightCard>
            ))}
          </div>
        </section>

        <section className="relative z-10 overflow-hidden py-16 md:py-20">
          <CtaIridescenceBackground prefersReduced={prefersReduced} />
          <div className="relative z-10 mx-auto max-w-4xl px-6">
            <SpotlightCard className="relative rounded-2xl border border-border bg-surface/80 p-8 text-center backdrop-blur transition-colors hover:border-coral/50 md:p-12">
            <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              {t('landing.ctaHeadline')}
            </h2>
            <p className="mx-auto mt-3 max-w-lg font-body text-sm text-text-secondary md:text-base">
              {t('landing.ctaSub')}
            </p>

            <div className="mx-auto mt-8 max-w-xl border-t border-border pt-8">
              <h3 className="font-display text-lg font-semibold tracking-tight text-text-primary md:text-xl">
                {t('landing.ctaBandTitle')}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-text-secondary md:text-base">
                {t('landing.ctaBandSub')}
              </p>
            </div>

            <ul className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
              {CONVERSION_POINTS.map(({ icon, animated, iconSize, textKey }) => (
                <li key={textKey} className="flex flex-col items-center gap-2 px-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coral/10">
                    {animated ? (
                      <MotionSafeIcon icon={icon as AnimatedIconComponent} size={iconSize} className="text-coral" />
                    ) : (
                      <FileText className="h-5 w-5 text-coral" />
                    )}
                  </div>
                  <p className="font-body text-sm leading-snug text-text-secondary">{t(textKey)}</p>
                </li>
              ))}
            </ul>

            <Link
              href="/sign-up"
              className="relative btn-shine mt-8 inline-flex min-h-[44px] items-center justify-center overflow-hidden rounded-xl bg-coral px-8 py-3 font-body text-sm font-semibold text-white shadow-sm transition-colors hover:bg-coral-dark"
            >
              {t('landing.ctaButton')}
            </Link>
          </SpotlightCard>
          </div>
        </section>

        <div className="relative z-10">
          <MarketingFooter />
        </div>
      </main>

      <ThemeToggle
        variant="floating-label"
        buttonRef={toggleRef}
        wrapperClassName="fixed bottom-6 right-6 z-50"
        style={{ opacity: hiddenUntilAnimated }}
      />
    </div>
  );
}
