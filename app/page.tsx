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
    description: '12 sections covering objectives, activities, differentiation and assessment — every time.',
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
              duration: 500,
              delay: stagger(120),
              easing: 'easeOutCubic',
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    if (featuresRef.current) observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Aurora background — hero area */}
      {!prefersReduced && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px]" aria-hidden="true">
          <SoftAurora
            speed={0.4}
            scale={1.5}
            brightness={0.8}
            color1="#FF8BB0"
            color2="#F7C34B"
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
              className="rounded-lg px-4 py-2 text-sm font-body text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="relative btn-shine overflow-hidden rounded-xl bg-coral px-4 py-2 text-sm font-body font-semibold text-white hover:bg-coral-dark transition-colors"
            >
              Get started free
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
                      stroke="#FF8BB0"
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

        {/* Features */}
        <section ref={featuresRef} className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold text-text-primary">
              <ShinyText text="Everything teachers need" shineColor="rgba(247,195,75,0.7)" speed={6} />
            </h2>
            <p className="mt-2 font-body text-text-secondary">Built with your real workflow in mind.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description, color }, i) => (
              <SpotlightCard
                key={title}
                className="rounded-2xl"
                spotlightColor={i === 1 ? 'rgba(247,195,75,0.15)' : 'rgba(255,139,176,0.15)'}
              >
                <Card
                  data-feature
                  className="border-border/60 bg-surface dark:bg-card shadow-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl"
                >
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-text-primary">{title}</h3>
                    <p className="mt-2 font-body text-sm text-text-secondary leading-relaxed">{description}</p>
                  </CardContent>
                </Card>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* CTA banner */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="rounded-2xl bg-coral/10 border border-coral/20 px-8 py-10 text-center">
            <h2 className="font-display text-3xl font-bold text-text-primary">
              <ShinyText text="Ready to reclaim your evenings?" shineColor="rgba(255,139,176,0.9)" speed={6} />
            </h2>
            <p className="mt-3 font-body text-text-secondary max-w-md mx-auto">
              Join teachers who've stopped spending hours on planning and started spending that time on what matters.
            </p>
            <Link
              href="/sign-up"
              className="relative btn-shine overflow-hidden mt-6 inline-flex items-center gap-2 rounded-xl bg-coral px-8 py-3 font-body font-semibold text-white shadow-sm hover:bg-coral-dark transition-colors"
            >
              Get started for free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6">
          <Logo size="sm" />
          <p className="font-body text-xs text-text-secondary">
            &copy; {new Date().getFullYear()} FreePeriod. Built for teachers.
          </p>
        </div>
      </footer>

      {/* Floating dark/light mode toggle */}
      <button
        ref={toggleRef}
        aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-display font-semibold text-sm text-primary-foreground shadow-lg btn-shine overflow-hidden"
        style={{ opacity: 0 }}
      >
        {resolvedTheme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
        {resolvedTheme === 'dark' ? 'Try light mode' : 'Try dark mode'}
      </button>
    </div>
  );
}
