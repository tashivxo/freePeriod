'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { animate } from 'animejs';

const SIZE_PX = 176;

export function HeroPictogram() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wrap = wrapRef.current;
    const mark = markRef.current;
    if (!wrap || !mark) return;

    if (mq.matches) {
      wrap.style.opacity = '1';
      wrap.style.transform = 'scale(1)';
      return;
    }

    animate(wrap, {
      scale: [0.94, 1],
      opacity: [0, 1],
      duration: 650,
      easing: 'easeOutCubic',
    });

    animate(mark, {
      scale: [1, 1.035, 1],
      duration: 3200,
      delay: 700,
      loop: true,
      easing: 'easeInOutSine',
    });
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative flex h-44 w-44 items-center justify-center sm:h-48 sm:w-48"
      style={{ opacity: 0, willChange: 'transform, opacity' }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-full bg-coral/10" />
      <div
        ref={markRef}
        className="relative h-[88%] w-[88%] rounded-full"
        style={{ willChange: 'transform' }}
      >
        <Image
          src="/brand/pictogram.png"
          alt=""
          width={SIZE_PX}
          height={SIZE_PX}
          className="h-full w-full rounded-full object-cover"
          priority
        />
      </div>
    </div>
  );
}
