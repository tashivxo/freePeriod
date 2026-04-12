'use client';

import dynamic from 'next/dynamic';
import { useTheme } from '@/lib/theme';

const ColorBends = dynamic(() => import('@/components/ColorBends'), { ssr: false });

export function ColorBendsBackground() {
  const { resolvedTheme } = useTheme();
  const colors = resolvedTheme === 'dark'
    ? ['#FFB8D0', '#D4A52E', '#1a1a1a']
    : ['#FF8BB0', '#F7C34B', '#FFFBF7'];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <ColorBends
        colors={colors}
        speed={0.1}
        rotation={20}
        scale={1}
        frequency={0.8}
        warpStrength={0.7}
        mouseInfluence={0.25}
        parallax={0.2}
        noise={0.08}
      />
    </div>
  );
}
