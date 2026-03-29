'use client';

import { useEffect, useRef } from 'react';
import { animate, remove } from 'animejs';

export function MugAnimation() {
  const mugRef = useRef<SVGSVGElement>(null);
  const steam1Ref = useRef<SVGPathElement>(null);
  const steam2Ref = useRef<SVGPathElement>(null);
  const steam3Ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Mug entrance
    if (mugRef.current) {
      animate(mugRef.current, {
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutBack',
      });
    }

    // Steam animations
    const steamTargets = [steam1Ref.current, steam2Ref.current, steam3Ref.current].filter(Boolean);

    steamTargets.forEach((target, i) => {
      if (target) {
        animate(target, {
          translateY: [0, -12],
          opacity: [0.6, 0],
          duration: 1600,
          delay: i * 300,
          loop: true,
          easing: 'easeOutSine',
        });
      }
    });

    return () => {
      if (mugRef.current) remove(mugRef.current);
      steamTargets.forEach((t) => { if (t) remove(t); });
    };
  }, []);

  return (
    <svg
      ref={mugRef}
      viewBox="0 0 120 120"
      className="h-32 w-32"
      aria-hidden="true"
      style={{ opacity: 0 }}
    >
      {/* Steam paths */}
      <path
        ref={steam1Ref}
        d="M40 38 Q42 28 40 18"
        stroke="#FF8BB0"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0"
      />
      <path
        ref={steam2Ref}
        d="M55 35 Q57 25 55 15"
        stroke="#F7C34B"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0"
      />
      <path
        ref={steam3Ref}
        d="M70 38 Q68 28 70 18"
        stroke="#FF8BB0"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0"
      />

      {/* Mug body */}
      <rect
        x="25"
        y="42"
        width="60"
        height="55"
        rx="6"
        fill="#FFFBF7"
        stroke="#FF8BB0"
        strokeWidth="3"
      />

      {/* Mug handle */}
      <path
        d="M85 55 Q100 55 100 70 Q100 85 85 85"
        stroke="#FF8BB0"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Liquid */}
      <rect
        x="30"
        y="52"
        width="50"
        height="40"
        rx="3"
        fill="#FF8BB0"
        opacity="0.2"
      />

      {/* Heart on mug */}
      <path
        d="M48 68 Q48 62 55 62 Q62 62 62 68 Q62 76 55 82 Q48 76 48 68Z"
        fill="#F7C34B"
        opacity="0.6"
      />
    </svg>
  );
}
