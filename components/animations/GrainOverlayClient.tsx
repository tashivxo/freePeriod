'use client';

import dynamic from 'next/dynamic';

const GrainOverlay = dynamic(
  () => import('@/components/animations/GrainOverlay').then((m) => m.GrainOverlay),
  { ssr: false }
);

export function GrainOverlayClient() {
  return <GrainOverlay />;
}
