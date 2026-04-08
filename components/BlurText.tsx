'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface BlurTextProps {
  text: string;
  className?: string;
  /** HTML element to render as the wrapper (default: 'span') */
  as?: React.ElementType;
  /** Per-word stagger delay in seconds (default: 0.05) */
  delay?: number;
  /** Animation duration per word in seconds (default: 0.4) */
  duration?: number;
}

export function BlurText({
  text,
  className,
  as: Tag = 'span',
  delay = 0.05,
  duration = 0.4,
}: BlurTextProps) {
  const prefersReduced = useReducedMotion();
  const words = text.split(' ');

  // Wrap element — use a span so we can spread aria-label
  const Wrapper = Tag as React.ElementType;

  if (prefersReduced) {
    return <Wrapper className={className}>{text}</Wrapper>;
  }

  return (
    <Wrapper className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration, delay: i * delay, ease: 'easeOut' }}
          style={{
            display: 'inline-block',
            marginRight: i < words.length - 1 ? '0.3em' : 0,
          }}
        >
          {word}
        </motion.span>
      ))}
    </Wrapper>
  );
}

export default BlurText;
