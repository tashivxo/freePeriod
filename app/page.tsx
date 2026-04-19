'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { PenLine, Download, Sparkles, CheckCircle2, Clock, BookOpen, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { animate, stagger } from 'animejs';
import { Logo } from '@/components/ui/Logo';
import { ShinyText } from '@/components/ShinyText';
import { Card, CardContent } from '@/components/ui/card';
import { SpotlightCard } from '@/components/SpotlightCard';
import { CORAL, MUSTARD } from '@/lib/utils/brand-colors';
import dynamic from 'next/dynamic';

const MugAnimation = dynamic(
  () => import('@/components/animations/MugAnimation').then((m) => m.MugAnimation),
  { ssr: false }
);

const SoftAurora = dynamic(
  () => import('@/components/ui/SoftAurora/SoftAurora'),
  { ssr: false }
);

const FEATURES = [
  {
    icon: PenLine,
    title: 'Structured Plans',
    description: '12 sections covering objectives, activities, differentiation and assessment, every time.',
    color: 'bg-coral/10 text-coral',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Claude generates plans tailored to your subject, year group and curriculum in seconds.',
    color: 'bg-mustard/20 text-mustard-dark',
  },
  {
    icon: Download,
    title: 'Export Anywhere',
    description: 'Download as DOCX or PDF. Fill your own template. Edit inline before exporting.',
    color: 'bg-coral/10 text-coral',
  },
] as const;

const PERKS = [
  'No more Sunday planning marathons',
  'Differentiation built in, every time',
  'Works with any subject or year group',
];

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

    // Hero entrance
    if (heroRef.current) {
      const targets = heroRef.current.querySelectorAll('[data-animate]');
      animate(targets, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 600,
        delay: stagger(100),
        easing: 'easeOutCubic',
      });
    }

    // Toggle entrance after 1s delay
    if (toggleRef.current) {
      animate(toggleRef.current, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 600,
        delay: 1000,
        easing: 'easeOutCubic',
      });
    }

    // Features on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll('[data-feature]');
            animate(cards, {
              translateY: [24, 0],
              opacity: [0, 1],
              duration: 600,
              delay: stagger(80),
              easing: 'easeOutCubic',
            });
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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Aurora background — hero area */}
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

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Logo size="sm" />
          <nav className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral/90 transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative">
        {/* Hero */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-16">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
            {/* Text */}
            <div ref={heroRef} className="flex-1 text-center lg:text-left">
              <div
                data-animate
                className="mb-4 inline-flex items-center gap-2 rounded-full bg-coral/10 px-4 py-1.5"
                style={{ opacity: 0 }}
              >
                <Sparkles className="h-3.5 w-3.5 text-coral" />
                <span className="text-xs font-body font-semibold text-coral">Powered by Claude AI</span>
              </div>

              <h1
                data-animate
                className="font-display text-5xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-6xl"
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
                </span>
                {' '}not hours
              </h1>

              <p
                data-animate
                className="mt-6 font-body text-lg text-text-primary max-w-lg"
                style={{ opacity: 0 }}
              >
                Upload your curriculum docs, describe what you need, and FreePeriod
                generates a complete, structured lesson plan you can edit and export.
              </p>

              <ul data-animate className="mt-5 space-y-2" style={{ opacity: 0 }}>
                {PERKS.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 justify-center lg:justify-start">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-coral" />
                    <span className="text-sm font-body text-text-primary">{perk}</span>
                  </li>
                ))}
              </ul>

              <div
                data-animate
                className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
                style={{ opacity: 0 }}
              >
                <Link
                  href="/sign-up"
                  className="relative btn-shine overflow-hidden inline-flex items-center gap-2 rounded-xl bg-coral px-6 py-3 font-body font-semibold text-white shadow-sm hover:bg-coral-dark transition-colors"
                >
                  Start for free
                </Link>
                <Link
                  href="/sign-in"
                  className="relative btn-shine overflow-hidden inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 font-body font-medium text-text-primary hover:bg-muted transition-colors dark:bg-white/10 dark:border-white/25 dark:text-white dark:hover:bg-white/15"
                >
                  Sign in
                </Link>
              </div>

              <div data-animate className="mt-6 flex items-center gap-4 justify-center lg:justify-start" style={{ opacity: 0 }}>
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

            {/* Mug illustration */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <div className="relative flex h-48 w-48 items-center justify-center rounded-3xl bg-coral/10">
                <MugAnimation />
              </div>
            </div>
          </div>
        </section>

        {/* Mug Animation */}
        <section className="relative z-10 mx-auto max-w-5xl px-4 py-12 md:py-20">
          <MugAnimation />
        </section>

        {/* Features */}
        <section
          id="features"
          ref={featuresRef}
          className="relative z-10 mx-auto max-w-5xl px-4 py-12 md:py-20"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary text-center mb-12">
            Why Teachers Love FreePeriod
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, color }, idx) => (
              <SpotlightCard
                key={idx}
                data-feature
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface/50 backdrop-blur p-6 md:p-8 hover:border-coral/50 transition-colors"
              >
                <div className={`inline-flex p-3 rounded-xl ${color} mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-text-primary mb-2">{title}</h3>
                <p className="font-body text-text-secondary text-sm">{description}</p>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* Social Proof */}
        <section className="relative z-10 mx-auto max-w-4xl px-4 py-12 md:py-20">
          <div className="rounded-2xl border border-border bg-surface/50 backdrop-blur p-8 md:p-12 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-text-primary mb-6">
              Save Hours Every Week
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {PERKS.map((perk) => (
                <div key={perk} className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-coral" />
                  <p className="font-body text-text-secondary">{perk}</p>
                </div>
              ))}
            </div>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-xl bg-coral px-8 py-3 text-base font-semibold text-white hover:bg-coral/90 transition-colors"
            >
              Start Planning Smarter
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border bg-background py-8">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <p className="font-body text-sm text-text-secondary">
              © 2024 FreePeriod. Built for teachers, by teachers.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
