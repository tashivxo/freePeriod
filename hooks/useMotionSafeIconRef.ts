'use client';

import { useRef, useSyncExternalStore } from 'react';

import type { AnimatedIconHandle } from '@/components/ui/icons/types';
import { useZenMode } from '@/providers/zen-mode';

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function useMotionSafeIconRef() {
  const ref = useRef<AnimatedIconHandle>(null);
  const prefersReduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const { zenMode } = useZenMode();

  return {
    ref,
    animationDisabled: prefersReduced || zenMode,
  };
}
