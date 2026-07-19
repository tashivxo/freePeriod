'use client';

import { useRef } from 'react';
import type { ReactNode, CSSProperties, FocusEvent } from 'react';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  style?: CSSProperties;
}

export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(255,139,176,0.15)',
  style,
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);

  function setSpotlight(x: string, y: string, opacity: string) {
    const el = divRef.current;
    if (!el) return;
    el.style.setProperty('--spotlight-x', x);
    el.style.setProperty('--spotlight-y', y);
    el.style.setProperty('--spotlight-color', spotlightColor);
    el.style.setProperty('--spotlight-opacity', opacity);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = divRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpotlight(`${e.clientX - rect.left}px`, `${e.clientY - rect.top}px`, '1');
  }

  function handleMouseLeave() {
    // Keep focus-within glow if keyboard focus remains inside
    if (divRef.current?.matches(':focus-within')) {
      setSpotlight('50%', '50%', '0.85');
      return;
    }
    setSpotlight('50%', '50%', '0');
  }

  function handleFocusCapture() {
    setSpotlight('50%', '50%', '0.85');
  }

  function handleBlurCapture(e: FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget as Node | null;
    if (next && divRef.current?.contains(next)) return;
    setSpotlight('50%', '50%', '0');
  }

  return (
    <div
      ref={divRef}
      className={`relative overflow-hidden ${className}`}
      style={
        {
          '--spotlight-x': '50%',
          '--spotlight-y': '50%',
          '--spotlight-color': spotlightColor,
          '--spotlight-opacity': '0',
          ...style,
        } as CSSProperties
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(400px at var(--spotlight-x) var(--spotlight-y), var(--spotlight-color), transparent 80%)',
          opacity: 'var(--spotlight-opacity)' as string,
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
