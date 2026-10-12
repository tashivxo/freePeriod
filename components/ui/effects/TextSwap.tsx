'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { TEXT_SWAP } from '@/lib/motion/tokens';
import { cn } from '@/lib/utils';

type Phase = 'idle' | 'exit' | 'enter-start' | 'enter';

type TextSwapTag = 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'li';

type TextSwapProps = {
  /** Changes trigger exit → swap → enter. Keep stable when copy is unchanged. */
  swapKey: string;
  children: ReactNode;
  as?: TextSwapTag;
  className?: string;
  style?: CSSProperties;
  id?: string;
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function TextSwap({
  as: Tag = 'span',
  swapKey,
  children,
  className,
  style,
  id,
  ...rest
}: TextSwapProps & Record<string, unknown>) {
  const [displayed, setDisplayed] = useState(children);
  const [phase, setPhase] = useState<Phase>('idle');
  const displayedKeyRef = useRef(swapKey);
  const incomingRef = useRef(children);
  const nodeRef = useRef<HTMLElement | null>(null);

  incomingRef.current = children;

  useLayoutEffect(() => {
    if (swapKey === displayedKeyRef.current) {
      setDisplayed(incomingRef.current);
      return;
    }

    if (prefersReducedMotion()) {
      displayedKeyRef.current = swapKey;
      setDisplayed(incomingRef.current);
      setPhase('idle');
      return;
    }

    let cancelled = false;
    let timeout = 0;
    let enterDone = 0;
    let raf1 = 0;
    let raf2 = 0;

    setPhase('exit');

    timeout = window.setTimeout(() => {
      if (cancelled) return;
      displayedKeyRef.current = swapKey;
      setDisplayed(incomingRef.current);
      setPhase('enter-start');
      raf1 = requestAnimationFrame(() => {
        nodeRef.current?.getBoundingClientRect();
        raf2 = requestAnimationFrame(() => {
          if (cancelled) return;
          setPhase('enter');
          enterDone = window.setTimeout(() => {
            if (!cancelled) setPhase('idle');
          }, TEXT_SWAP.enterMs);
        });
      });
    }, TEXT_SWAP.exitMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.clearTimeout(enterDone);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [swapKey]);

  const phaseClass =
    phase === 'exit'
      ? 'is-exit'
      : phase === 'enter-start'
        ? 'is-enter-start'
        : phase === 'enter'
          ? 'is-enter'
          : '';

  return (
    <Tag
      ref={nodeRef as never}
      id={id}
      className={cn('t-text-swap', phaseClass, className)}
      style={style}
      {...rest}
    >
      {displayed}
    </Tag>
  );
}
