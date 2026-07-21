'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { ZapIcon } from '@/components/ui/zap';
import { MotionSafeIcon } from '@/components/icons/MotionSafeIcon';
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { useZenMode } from '@/providers/zen-mode';

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type UpgradePromptProps = {
  open: boolean;
  onDismiss: () => void;
};

export function UpgradePrompt({ open, onDismiss }: UpgradePromptProps) {
  const router = useRouter();
  const { zenMode } = useZenMode();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!open) return;

    if (prefersReduced || zenMode) return;

    import('animejs').then((mod) => {
      const el = containerRef.current;
      if (!el) return;
      mod.animate(el, {
        opacity: [0, 1],
        translateY: [24, 0],
        duration: 400,
        easing: 'easeOutCubic',
      });
    });
  }, [open, prefersReduced, zenMode]);

  function handleUpgrade() {
    onDismiss();
    router.push('/settings#billing');
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDismiss(); }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent
          aria-label="Upgrade to Pro"
          className="max-w-md border-0 bg-background p-0 shadow-xl"
          onInteractOutside={onDismiss}
        >
          <div ref={containerRef} style={{ opacity: open && !prefersReduced && !zenMode ? undefined : open ? 1 : 0 }}>
            {/* Header */}
            <div className="relative flex flex-col items-center gap-3 rounded-t-xl bg-gradient-to-br from-coral/20 to-mustard/10 px-6 pt-8 pb-6">
              <button
                type="button"
                aria-label="Dismiss"
                onClick={onDismiss}
                className="absolute right-4 top-4 rounded-full p-1.5 text-text-secondary transition-colors hover:bg-text-primary/5 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-coral"
              >
                <X size={16} />
              </button>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-coral shadow-lg">
                <MotionSafeIcon icon={ZapIcon} size={28} className="text-white" />
              </div>

              <div className="text-center">
                <h2 className="font-display text-xl font-bold text-text-primary">
                  Upgrade to Pro
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  You&apos;ve reached the 3-lesson free plan limit for this month.
                </p>
              </div>
            </div>

            {/* Features list */}
            <div className="px-6 py-5">
              <ul className="space-y-3 text-sm text-text-primary">
                {[
                  '20 lesson plans per month on Pro',
                  'Unlimited on Pro+',
                  'Fast and Quality generation modes',
                  'DOCX export and filled-in template download',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral/15 text-coral">
                      <MotionSafeIcon icon={ZapIcon} size={11} className="text-coral" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 px-6 pb-6">
              <Button
                onClick={handleUpgrade}
                className="w-full bg-coral font-semibold text-white hover:bg-coral/90 focus-visible:ring-coral"
              >
                Upgrade to Pro
              </Button>
              <button
                type="button"
                onClick={onDismiss}
                className="w-full rounded-lg py-2 text-sm text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-coral"
              >
                Maybe later
              </button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
