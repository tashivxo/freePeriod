'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, X } from 'lucide-react';
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';

type UpgradePromptProps = {
  open: boolean;
  onDismiss: () => void;
};

export function UpgradePrompt({ open, onDismiss }: UpgradePromptProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

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
  }, [open]);

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
          className="max-w-md border-0 bg-[#FFFBF7] p-0 shadow-xl"
          onInteractOutside={onDismiss}
        >
          <div ref={containerRef} style={{ opacity: open ? undefined : 0 }}>
            {/* Header */}
            <div className="relative flex flex-col items-center gap-3 rounded-t-xl bg-gradient-to-br from-[#FF8BB0]/20 to-[#F7C34B]/10 px-6 pt-8 pb-6">
              <button
                aria-label="Dismiss"
                onClick={onDismiss}
                className="absolute right-4 top-4 rounded-full p-1.5 text-[#6B7280] transition-colors hover:bg-[#1A1A2E]/5 hover:text-[#1A1A2E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8BB0]"
              >
                <X size={16} />
              </button>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF8BB0] shadow-lg">
                <Zap size={28} fill="white" className="text-white" />
              </div>

              <div className="text-center">
                <h2 className="font-nunito text-xl font-bold text-[#1A1A2E]">
                  Upgrade to Pro
                </h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  You&apos;ve reached the 5-lesson free plan limit.
                </p>
              </div>
            </div>

            {/* Features list */}
            <div className="px-6 py-5">
              <ul className="space-y-3 text-sm text-[#1A1A2E]">
                {[
                  'Unlimited lesson plan generations',
                  'Claude AI (smarter, more detailed plans)',
                  'Priority generation speed',
                  'All export formats: DOCX, PDF, XLSX',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF8BB0]/15 text-[#FF8BB0]">
                      <Zap size={11} fill="currentColor" />
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
                className="w-full bg-[#FF8BB0] font-semibold text-white hover:bg-[#FF8BB0]/90 focus-visible:ring-[#FF8BB0]"
              >
                Upgrade to Pro
              </Button>
              <button
                onClick={onDismiss}
                className="w-full rounded-lg py-2 text-sm text-[#6B7280] hover:text-[#1A1A2E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8BB0]"
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
