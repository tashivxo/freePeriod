'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { PenLine, Download, Sparkles, Clock, BookOpen, Moon, Sun, FileText } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { animate, stagger } from 'animejs';
import { Logo } from '@/components/ui/Logo';
import { MarketingFooter } from '@/components/legal/MarketingFooter';
import { ShinyText } from '@/components/ui/ShinyText';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { CORAL, MUSTARD } from '@/lib/utils/brand-colors';
import dynamic from 'next/dynamic';

const HeroPictogram = dynamic(
  () => import('@/components/animations/HeroPictogram').then((m) => m.HeroPictogram),
  { ssr: false }
);

const SoftAurora = dynamic(
  () => import('@/components/ui/SoftAurora/SoftAurora'),
  { ssr: false }
);

const LEAD_FEATURE = {
  icon: PenLine,
  title: 'Structured Plans',
  description:
    'Twelve sections covering objectives, activities, differentiation, and assessment — consistent structure you can trust every time.',
  color: 'bg-coral/10 text-coral',
} as const;

const SUPPORTING_FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Tailored to your subject, year group, and curriculum in seconds.',
    color: 'bg-mustard/20 text-mustard-dark',
  },
  {
    icon: Download,
    title: 'Export Anywhere',
    description: 'Download as DOCX or a filled-in template. Edit inline before exporting.',
    color: 'bg-coral/10 text-coral',
  },
] as const;

const CONVERSION_POINTS = [
  {
    icon: FileText,
    text: '12 structured sections in every plan',
  },
  {
    icon: PenLine,
    text: 'Edit before you export',
  },
  {
    icon: BookOpen,
    text: 'Free to start. No credit',
  },
] as const;

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

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
            <Link
              href="/pricing"
              className="px-3 py-2 text-sm font-body text-text-secondary transition-colors hover:text-text-primary"
            >
              Pricing
            </Link>
            <Link
              href="/sign-in"
              className="relative btn-shine overflow-hidden rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
            >
              Sign in
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
                style={{ opacity: 0 }}
              >
                Lesson plans in{' '}
                <span className="relative whitespace-nowrap text-coral">
                  seconds,
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
                not hours
              </h1>

              <p
                data-animate
                className="mt-5 max-w-lg font-body text-base leading-relaxed text-text-secondary sm:text-lg"
                style={{ opacity: 0 }}
              >
                Upload your curriculum docs, describe what you need, and FreePeriod
                generates a complete, structured lesson plan you can edit and export.
              </p>

              <div
                data-animate
                className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start"
                style={{ opacity: 0 }}
              >
                <Link
                  href="/sign-up"
                  className="relative btn-shine inline-flex min-h-[44px] items-center gap-2 overflow-hidden rounded-xl bg-coral px-6 py-3 font-body text-sm font-semibold text-white shadow-sm transition-colors hover:bg-coral-dark"
                >
                  Start for free
                </Link>
                <Link
                  href="/sign-in"
                  className="relative btn-shine inline-flex min-h-[44px] items-center gap-2 overflow-hidden rounded-xl border border-border bg-surface px-6 py-3 font-body text-sm font-medium text-text-primary transition-colors hover:bg-muted dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                >
                  Sign in
                </Link>
              </div>

              <div
                data-animate
                className="mt-5 flex items-center justify-center gap-4 lg:justify-start"
                style={{ opacity: 0 }}
              >
                <div className="flex items-center gap-1.5 text-xs font-body text-text-secondary">
                  <Clock className="h-3.5 w-3.5" />
                  Avg. 15 seconds to generate
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1.5 text-xs font-body text-text-secondary">
                  <BookOpen className="h-3.5 w-3.5" />
                  Free to start
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
              <ShinyText text="Why Teachers Love FreePeriod" speed={4} />
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-body text-sm text-text-secondary md:text-base">
              Structure you can trust, speed when you need it.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 lg:grid-rows-2 lg:gap-6">
            <SpotlightCard
              data-feature
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface/50 p-7 backdrop-blur transition-colors hover:border-coral/50 lg:row-span-2 lg:p-9"
            >
              <div className={`mb-5 inline-flex rounded-xl p-3.5 ${LEAD_FEATURE.color}`}>
                <LeadIcon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 font-display text-2xl font-semibold text-text-primary">
                {LEAD_FEATURE.title}
              </h3>
              <p className="max-w-md font-body text-sm leading-relaxed text-text-secondary md:text-base">
                {LEAD_FEATURE.description}
              </p>
            </SpotlightCard>

            {SUPPORTING_FEATURES.map(({ icon: Icon, title, description, color }) => (
              <SpotlightCard
                key={title}
                data-feature
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface/50 p-6 backdrop-blur transition-colors hover:border-coral/50 md:p-7"
              >
                <div className={`mb-4 inline-flex rounded-xl p-3 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">{title}</h3>
                <p className="font-body text-sm leading-relaxed text-text-secondary">{description}</p>
              </SpotlightCard>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-4xl px-6 py-16 md:py-20">
          <SpotlightCard className="rounded-2xl border border-border bg-surface/50 p-8 text-center backdrop-blur transition-colors hover:border-coral/50 md:p-12">
            <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Ready to reclaim your evenings?
            </h2>
            <p className="mx-auto mt-3 max-w-lg font-body text-sm text-text-secondary md:text-base">
              Join teachers who plan faster without sacrificing structure.
            </p>

            <div className="mx-auto mt-8 max-w-xl border-t border-border pt-8">
              <h3 className="font-display text-lg font-semibold tracking-tight text-text-primary md:text-xl">
                Your plan, your way
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-text-secondary md:text-base">
                Start from scratch, or send your template and AI fills it in.
              </p>
            </div>

            <ul className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
              {CONVERSION_POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex flex-col items-center gap-2 px-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coral/10">
                    <Icon className="h-5 w-5 text-coral" />
                  </div>
                  <p className="font-body text-sm leading-snug text-text-secondary">{text}</p>
                </li>
              ))}
            </ul>

            <Link
              href="/sign-up"
              className="relative btn-shine mt-8 inline-flex min-h-[44px] items-center justify-center overflow-hidden rounded-xl bg-coral px-8 py-3 font-body text-sm font-semibold text-white shadow-sm transition-colors hover:bg-coral-dark"
            >
              Start for free
            </Link>
          </SpotlightCard>
        </section>

        <div className="relative z-10">
          <MarketingFooter />
        </div>
      </main>

      <button
        ref={toggleRef}
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="fixed bottom-6 right-6 z-50 btn-shine flex min-h-[44px] items-center gap-2 overflow-hidden rounded-full border border-border bg-surface px-4 py-2.5 font-body text-sm font-medium text-text-primary shadow-lg transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
        style={{ opacity: 0 }}
      >
        {resolvedTheme === 'dark' ? (
          <>
            <Sun className="h-4 w-4" />
            Try light mode
          </>
        ) : (
          <>
            <Moon className="h-4 w-4" />
            Try dark mode
          </>
        )}
      </button>
    </div>
  );
}
