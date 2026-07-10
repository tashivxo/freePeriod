'use client';

import dynamic from 'next/dynamic';

const Iridescence = dynamic(() => import('@/components/Iridescence'), { ssr: false });

/** Warm coral tint for brand-aligned shader (RGB 0–1). */
const CORAL_SHADER_COLOR: [number, number, number] = [1, 0.55, 0.69];

interface CtaIridescenceBackgroundProps {
  prefersReduced: boolean;
}

export function CtaIridescenceBackground({ prefersReduced }: CtaIridescenceBackgroundProps) {
  if (prefersReduced) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-1/2 h-[min(1080px,100vh)] w-full -translate-y-1/2 opacity-35 blur-[1px] dark:opacity-25"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,139,176,0.18),transparent_68%)]" />
      <Iridescence
        color={CORAL_SHADER_COLOR}
        speed={0.5}
        amplitude={0}
        mouseReact={false}
      />
    </div>
  );
}
