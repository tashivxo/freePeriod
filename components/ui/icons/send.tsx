'use client';

import type { Variants } from 'motion/react';
import { motion } from 'motion/react';

import { createAnimatedIcon } from '@/components/ui/icons/createAnimatedIcon';

// Source: Lucide Animated "send" (https://lucide-animated.com/icons/send), MIT.
const PLANE_VARIANTS: Variants = {
  normal: { x: 0, y: 0, scale: 1 },
  animate: {
    x: 3,
    y: -3,
    scale: 0.8,
    transition: { duration: 0.5 },
  },
};

const TRAIL_VARIANTS: Variants = {
  normal: {
    pathLength: 0,
    opacity: 0,
    x: -3,
    y: 3,
    transition: { duration: 0.3 },
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.55, delay: 0.1 },
  },
};

const SendIcon = createAnimatedIcon({
  displayName: 'SendIcon',
  onActivate: (controls) => controls.start('animate'),
  onDeactivate: (controls) => controls.start('normal'),
  render: ({ size, controls }) => (
    <svg
      className="overflow-visible"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.g animate={controls} initial="normal" variants={PLANE_VARIANTS}>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </motion.g>
      <motion.path
        animate={controls}
        d="M -3 28 C -0.5 26.8 1.6 24.6 3.3 22 C 4.8 19.7 5.2 17.6 4.2 16.1 C 3.2 14.7 1.4 14.5 0.3 15.8 C -0.9 17.2 -0.6 19.4 1.2 20.4 C 3.4 21.5 6.4 19.4 9 15.8"
        fill="none"
        initial="normal"
        stroke="currentColor"
        strokeDasharray="2 2"
        strokeWidth="1"
        variants={TRAIL_VARIANTS}
      />
    </svg>
  ),
});

export { SendIcon };