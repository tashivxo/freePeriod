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
    <>
      <SoftAurora />
      <main className="relative min-h-screen bg-background">
        {/* Navbar */}
        <nav className="relative z-50 mx-auto max-w-7xl px-4 py-4 md:py-6 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <button
              ref={toggleRef}
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg border border-border p-2 hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link
              href="/sign-in"
              className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral/90 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section ref={heroRef} className="relative z-10 mx-auto max-w-4xl px-4 py-12 md:py-20 text-center">
          <h1 data-animate className="font-display text-4xl md:text-6xl font-bold text-text-primary mb-4">
            <ShinyText text="Lesson plans" /> in seconds
          </h1>
          <p data-animate className="font-body text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
            Tired of hours spent planning? Let AI handle the heavy lifting. Generate structured, curriculum-aligned lesson plans tailored to your class in under a minute.
          </p>
          <div data-animate className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sign-up"
              className="relative inline-flex overflow-hidden items-center justify-center rounded-xl bg-coral px-8 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-shadow btn-shine"
            >
              Get Started Free
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center rounded-xl border border-border px-8 py-3 text-base font-semibold text-text-primary hover:bg-muted transition-colors"
            >
              Learn More
            </Link>
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
    </>
  );
}
