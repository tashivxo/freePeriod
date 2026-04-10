'use client';

import dynamic from 'next/dynamic';

const ColorBends = dynamic(() => import('@/components/ColorBends'), { ssr: false });

export function ColorBendsBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <ColorBends
        colors={['#FF8BB0', '#F7C34B', '#FFFBF7']}
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
