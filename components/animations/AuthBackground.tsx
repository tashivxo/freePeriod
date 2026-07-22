'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useTheme } from '@/providers/theme';

const Waves = dynamic(() => import('@/components/ui/backgrounds/Waves/Waves'), { ssr: false });

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AuthBackground() {
  const { resolvedTheme } = useTheme();
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = resolvedTheme === 'dark';

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {prefersReduced ? (
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at 30% 20%, rgba(255,184,208,0.12) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(255,184,208,0.08) 0%, transparent 50%)'
              : 'radial-gradient(ellipse at 30% 20%, rgba(255,184,208,0.28) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(255,184,208,0.16) 0%, transparent 50%)',
          }}
        />
      ) : (
        <Waves
          lineColor={isDark ? 'rgba(255,184,208,0.18)' : 'rgba(255, 184, 208, 0.35)'}
          backgroundColor="transparent"
          waveSpeedX={0.008}
          waveSpeedY={0.003}
          waveAmpX={20}
          waveAmpY={10}
          xGap={12}
          yGap={36}
          friction={0.94}
          tension={0.004}
        />
      )}
    </div>
  );
}
