'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useZenMode } from '@/providers/zen-mode';

const GrainOverlay = dynamic(
  () => import('@/components/animations/GrainOverlay').then((m) => m.GrainOverlay),
  { ssr: false }
);

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function GrainOverlayClient() {
  const { zenMode } = useZenMode();
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (zenMode || prefersReduced) return null;

  return <GrainOverlay />;
}
