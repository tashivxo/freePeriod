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

    wrap.style.opacity = '1';
    wrap.style.transform = 'none';
    wrap.style.willChange = 'auto';

    if (mq.matches) {
      mark.style.willChange = 'auto';
      return;
    }

    mark.style.willChange = 'transform';

    const breathe = animate(mark, {
      scale: [1, 1.035, 1],
      duration: 3200,
      loop: true,
      easing: 'easeInOutSine',
    });

    return () => {
      try {
        breathe.pause();
      } catch {
        /* ignore */
      }
      mark.style.willChange = 'auto';
      wrap.style.willChange = 'auto';
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative flex h-44 w-44 items-center justify-center sm:h-48 sm:w-48"
      aria-hidden="true"
      data-testid="animated-logo"
    >
      <div className="absolute inset-0 rounded-full bg-coral/10" />
      <div ref={markRef} className="relative h-[88%] w-[88%] rounded-full">
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
