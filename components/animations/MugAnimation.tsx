'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

export function MugAnimation() {
  const wrapRef = useRef<SVGSVGElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const liquidRef = useRef<SVGRectElement>(null);
  const heartRef = useRef<SVGPathElement>(null);
  const steam1Ref = useRef<SVGCircleElement>(null);
  const steam2Ref = useRef<SVGCircleElement>(null);
  const steam3Ref = useRef<SVGCircleElement>(null);
  const steam4Ref = useRef<SVGCircleElement>(null);
  const steam5Ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;
    const svg = wrapRef.current;
    if (!svg) return;

    // Entrance
    animate(svg, { scale: [0.82, 1], opacity: [0, 1], duration: 650, easing: 'easeOutBack' });

    // Liquid fade-in after entrance
    if (liquidRef.current) {
      animate(liquidRef.current, { opacity: [0, 0.38], duration: 700, delay: 450, easing: 'easeOutQuad' });
    }

    // Heart pulse loop
    if (heartRef.current) {
      animate(heartRef.current, { scale: [1, 1.18, 1], duration: 1600, delay: 700, loop: true, easing: 'easeInOutSine' });
    }

    // Glow ring breathe
    if (glowRef.current) {
      animate(glowRef.current, { opacity: [0.12, 0.42, 0.12], scale: [1, 1.07, 1], duration: 2200, delay: 300, loop: true, easing: 'easeInOutSine' });
    }

    // Steam particles — float up and fade, loop
    const steamEls = [steam1Ref, steam2Ref, steam3Ref, steam4Ref, steam5Ref]
      .map((r) => r.current)
      .filter((el): el is SVGCircleElement => el !== null);

    if (steamEls.length > 0) {
      setTimeout(() => {
        animate(steamEls, {
          translateY: [0, -26],
          opacity: [{ value: 0, duration: 0 }, { value: 0.75, duration: 200 }, { value: 0, duration: 900 }],
          duration: 1100,
          delay: stagger(220, { start: 0 }),
          easing: 'easeOutQuad',
          loop: true,
          loopDelay: 600,
        });
      }, 600);
    }
  }, []);

  return (
    <svg
      ref={wrapRef}
      viewBox="0 0 120 120"
      width="108"
      height="108"
      style={{ opacity: 0, willChange: 'transform, opacity' }}
      aria-hidden="true"
    >
      {/* Ambient glow ring */}
      <circle
        ref={glowRef}
        cx="57" cy="73" r="42"
        fill="none"
        stroke="#FF8BB0"
        strokeWidth="1.5"
        opacity="0.12"
        style={{ willChange: 'transform, opacity' }}
      />
      {/* Steam particles */}
      <circle ref={steam1Ref} cx="38" cy="41" r="2.5" fill="#FF8BB0" opacity="0" />
      <circle ref={steam2Ref} cx="47" cy="38" r="2" fill="#F7C34B" opacity="0" />
      <circle ref={steam3Ref} cx="57" cy="36" r="2.5" fill="#FF8BB0" opacity="0" />
      <circle ref={steam4Ref} cx="67" cy="38" r="2" fill="#F7C34B" opacity="0" />
      <circle ref={steam5Ref} cx="76" cy="41" r="2.5" fill="#FF8BB0" opacity="0" />
      {/* Mug body */}
      <rect x="21" y="49" width="68" height="56" rx="8" fill="white" stroke="#FF8BB0" strokeWidth="2.5" />
      {/* Liquid fill */}
      <rect ref={liquidRef} x="26" y="58" width="58" height="41" rx="5" fill="#FF8BB0" opacity="0" />
      {/* Mug rim */}
      <rect x="19" y="44" width="72" height="9" rx="4.5" fill="white" stroke="#FF8BB0" strokeWidth="2.5" />
      {/* Handle */}
      <path
        d="M89 62 Q106 62 106 77 Q106 93 89 93"
        stroke="#FF8BB0"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Heart */}
      <path
        ref={heartRef}
        d="M57 83 C46 77 38 66 38 58 C38 50 44 46 51 50 C53.5 51.5 55.5 53 57 55 C58.5 53 60.5 51.5 63 50 C70 46 76 50 76 58 C76 66 68 77 57 83 Z"
        fill="#F7C34B"
        style={{ transformBox: 'fill-box', transformOrigin: 'center', willChange: 'transform' }}
      />
    </svg>
  );
}
