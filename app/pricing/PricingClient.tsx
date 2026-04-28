'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { LucideIcon } from 'lucide-react';
import { Check, Sparkles, Zap, BookOpen } from 'lucide-react';
import { animate, stagger } from 'animejs';
import { CORAL, MUSTARD } from '@/lib/utils/brand-colors';
import { MagicCard } from '@/components/ui/magic-card';
import { Logo } from '@/components/ui/Logo';
import { createClient } from '@/lib/supabase/client';

const SoftAurora = dynamic(
  () => import('@/components/ui/SoftAurora/SoftAurora'),
  { ssr: false },
);

interface Plan {
  id: string;
  name: string;
  Icon: LucideIcon;
  iconBg: string;
  priceMonthly: number;
  priceAnnual: number;
  description: string;
  features: string[];
  cta: string;
  ctaClass: string;
  href?: string;
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    Icon: BookOpen,
    iconBg: 'bg-coral/10',
    priceMonthly: 0,
    priceAnnual: 0,
    description: 'Perfect for trying out FreePeriod.',
    features: [
      '3 lesson plans per month',
      'Gemini AI model',
      'DOCX export',
      'Community support',
    ],
    cta: 'Get started free',
    ctaClass:
      'border border-coral text-coral hover:bg-coral/10 focus-visible:ring-2 focus-visible:ring-coral',
    href: '/sign-up',
  },
  {
    id: 'pro',
    name: 'Pro',
    Icon: Sparkles,
    iconBg: 'bg-coral/15',
    priceMonthly: 9,
    priceAnnual: 7,
    description: 'For teachers who plan lessons every week.',
    features: [
      'Unlimited lesson plans',
      'Claude AI (Sonnet)',
      'DOCX + PDF export',
      'Curriculum upload & OCR',
      'Priority support',
    ],
    cta: 'Start Pro',
    ctaClass:
      'bg-coral hover:bg-coral-dark text-white focus-visible:ring-2 focus-visible:ring-coral',
    featured: true,
  },
  {
    id: 'pro_plus',
    name: 'Pro+',
    Icon: Zap,
    iconBg: 'bg-[#1A1A2E]/10',
    priceMonthly: 12,
    priceAnnual: 10,
    description: 'For power users and whole-school teams.',
    features: [
      'Everything in Pro',
      'Claude AI (Opus)',
      'Custom template filling',
      'Team plan sharing',
      'API access',
    ],
    cta: 'Start Pro+',
    ctaClass:
      'bg-[#1A1A2E] hover:bg-[#0f0f1a] text-white focus-visible:ring-2 focus-visible:ring-[#1A1A2E]',
  },
];

export function PricingClient() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Detect reduced motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Entrance animations
  useEffect(() => {
    if (prefersReduced) return;

    if (headerRef.current) {
      const targets = headerRef.current.querySelectorAll('[data-animate]');
      animate(targets, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 600,
        delay: stagger(100),
        easing: 'easeOutCubic',
      });
    }

    const timer = setTimeout(() => {
      if (cardsRef.current) {
        const cards = cardsRef.current.querySelectorAll('[data-card]');
        animate(cards, {
          translateY: [24, 0],
          opacity: [0, 1],
          duration: 600,
          delay: stagger(120),
          easing: 'easeOutCubic',
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [prefersReduced]);

  const handleCheckout = useCallback(
    async (planId: string) => {
      setLoadingPlan(planId);
      try {
        // Check auth client-side first — redirect unauthenticated users directly
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push(`/sign-up?plan=${planId}`);
          return;
        }

        const res = await fetch(`/api/checkout?plan=${planId}`, {
          method: 'POST',
        });

        if (res.status === 401) {
          router.push(`/sign-up?plan=${planId}`);
          return;
        }

        const data = (await res.json()) as { url?: string; error?: string };
        if (data.url) {
          router.push(data.url);
        }
      } finally {
        setLoadingPlan(null);
      }
    },
    [router],
  );

  return (
    <div className="relative min-h-screen bg-background font-body">
      {/* Background aurora */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
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
      </div>

      {/* Public header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Logo size="sm" />
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-body text-text-secondary hover:text-text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              href="/sign-in"
              className="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-dark transition-colors min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 pb-24 pt-16">
        {/* Hero section */}
        <div ref={headerRef} className="mb-16 text-center">
          <div
            data-animate
            style={{ opacity: 0 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-coral/10 px-4 py-1.5 text-sm font-semibold text-coral"
          >
            <Sparkles size={14} />
            Simple, honest pricing
          </div>

          <h1
            data-animate
            style={{ opacity: 0 }}
            className="font-display text-4xl font-bold tracking-tight text-text-primary sm:text-5xl"
          >
            Plans for every classroom
          </h1>

          <p
            data-animate
            style={{ opacity: 0 }}
            className="mx-auto mt-4 max-w-xl text-lg text-text-secondary"
          >
            Start free, upgrade when you&apos;re ready. No credit card required.
          </p>

          {/* Billing toggle */}
          <div
            data-animate
            style={{ opacity: 0 }}
            className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-surface p-1.5 shadow-sm ring-1 ring-border/50"
          >
            <button
              onClick={() => setIsAnnual(false)}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
                !isAnnual
                  ? 'bg-coral text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Monthly
            </button>
            <button
              role="switch"
              aria-checked={isAnnual}
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
                isAnnual
                  ? 'bg-coral text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Annual
              <span className="rounded-full bg-mustard/20 px-2 py-0.5 text-xs font-bold text-mustard-dark">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {PLANS.map((plan) => {
            const { Icon } = plan;
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            const isLoading = loadingPlan === plan.id;

            return (
              <div
                key={plan.id}
                data-card
                style={{ opacity: 0 }}
                className={`relative ${plan.featured ? 'ring-2 ring-coral rounded-2xl' : ''}`}
              >
                {plan.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="rounded-full bg-coral px-3 py-1 text-xs font-bold text-white shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <MagicCard
                  className="h-full rounded-2xl p-6"
                  gradientColor={CORAL}
                  gradientOpacity={0.12}
                >
                  {/* Plan icon + name */}
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg}`}
                    >
                      <Icon size={20} className="text-coral" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-text-primary">
                      {plan.name}
                    </h2>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    {price === 0 ? (
                      <span className="font-display text-4xl font-bold text-text-primary">
                        Free
                      </span>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="font-display text-4xl font-bold text-text-primary">
                          ${price}
                        </span>
                        <span className="mb-1 text-sm text-text-secondary">/mo</span>
                      </div>
                    )}
                    {isAnnual && price > 0 && (
                      <p className="mt-1 text-xs text-text-secondary">
                        Billed as ${price * 12}/yr
                      </p>
                    )}
                  </div>

                  <p className="mb-6 text-sm text-text-secondary">{plan.description}</p>

                  {/* CTA */}
                  {plan.href ? (
                    <Link
                      href={plan.href}
                      className={`mb-6 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors min-h-[44px] focus-visible:outline-none ${plan.ctaClass}`}
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.id)}
                      disabled={isLoading}
                      className={`mb-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors min-h-[44px] focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${plan.ctaClass}`}
                    >
                      {isLoading ? (
                        <svg
                          className="h-4 w-4 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : null}
                      {plan.cta}
                    </button>
                  )}

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral/10">
                          <Check size={12} className="text-coral" />
                        </div>
                        <span className="text-sm text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </MagicCard>
              </div>
            );
          })}
        </div>

        {/* Trust footer */}
        <p className="mt-12 text-center text-sm text-text-secondary">
          All plans include a 14-day free trial. Cancel anytime. No hidden fees.
        </p>
      </main>
    </div>
  );
}
