'use client';

import dynamic from 'next/dynamic';

const Waves = dynamic(() => import('@/components/ui/Waves/Waves'), { ssr: false });

export function AppBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{ opacity: 0.13 }}
    >
      <Waves
        lineColor="rgba(255, 139, 176, 0.7)"
        backgroundColor="transparent"
        waveSpeedX={0.005}
        waveSpeedY={0.003}
        waveAmpX={28}
        waveAmpY={14}
        xGap={28}
        yGap={44}
        friction={0.93}
        tension={0.02}
        maxCursorMove={50}
      />
    </div>
  );
}
