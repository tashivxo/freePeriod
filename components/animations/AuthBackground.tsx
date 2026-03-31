'use client';

import dynamic from 'next/dynamic';

const Waves = dynamic(() => import('@/components/ui/Waves/Waves'), { ssr: false });

export function AuthBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <Waves
        lineColor="rgba(255, 184, 208, 0.35)"
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
    </div>
  );
}
