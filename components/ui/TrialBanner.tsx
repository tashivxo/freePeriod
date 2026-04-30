'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getTrialDaysRemaining } from '@/lib/utils/trial';

interface TrialBannerProps {
  trialEnd: string | null;
}

export function TrialBanner({ trialEnd }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('trial-banner-dismissed');
    if (isDismissed) setDismissed(true);
  }, []);

  const daysRemaining = getTrialDaysRemaining(trialEnd);

  if (dismissed || daysRemaining > 7 || daysRemaining === 0) return null;

  function handleDismiss() {
    localStorage.setItem('trial-banner-dismissed', 'true');
    setDismissed(true);
  }

  return (
    <div className="relative bg-coral px-4 py-3 text-center text-sm font-medium text-white">
      Your 30-day Pro trial ends in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.{' '}
      <a href="/pricing" className="underline underline-offset-2 hover:opacity-80">
        Upgrade to keep Pro features.
      </a>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Dismiss trial banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
