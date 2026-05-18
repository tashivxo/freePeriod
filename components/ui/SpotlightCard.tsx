'use client';

import { useRef } from 'react';
import type { ReactNode, CSSProperties } from 'react';

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

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = divRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (divRef.current) {
      divRef.current.style.setProperty('--spotlight-x', `${x}px`);
      divRef.current.style.setProperty('--spotlight-y', `${y}px`);
      divRef.current.style.setProperty('--spotlight-color', spotlightColor);
      divRef.current.style.setProperty('--spotlight-opacity', '1');
    }
  }

  function handleMouseLeave() {
    if (divRef.current) {
      divRef.current.style.setProperty('--spotlight-opacity', '0');
    }
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
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(400px at var(--spotlight-x) var(--spotlight-y), var(--spotlight-color), transparent 80%)',
          opacity: 'var(--spotlight-opacity)' as string,
        }}
      />
      {children}
    </div>
  );
}
