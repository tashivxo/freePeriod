'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Noise = dynamic(() => import('@/components/ui/Noise/Noise'), { ssr: false });

export function GrainOverlay() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (prefersReduced) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ mixBlendMode: 'overlay' }}
      aria-hidden="true"
    >
      <Noise patternAlpha={8} patternRefreshInterval={3} />
    </div>
  );
}
