'use client';

import type { Variants } from 'motion/react';
import { motion } from 'motion/react';

import { createMultiControlAnimatedIcon } from '@/components/ui/icons/createAnimatedIcon';

const RAY_LINE_VARIANTS: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  visible: {
    pathLength: 1,
    opacity: 1,
  },
};

const PROJECTOR_BODY_VARIANTS: Variants = {
  normal: {
    scale: 1,
    y: 0,
  },
  animate: {
    scale: [1, 1.08, 1],
    y: [0, -1, 0],
    transition: {
      duration: 0.8,
      ease: 'easeInOut',
    },
  },
};

const ProjectorIcon = createMultiControlAnimatedIcon({
  displayName: 'ProjectorIcon',
  controlKeys: ['path', 'body'],
  onActivate: (controls) => {
    controls.body.start('animate');
    void controls.path.start('hidden').then(() => controls.path.start('animate'));
  },
  onDeactivate: (controls) => {
    controls.body.start('normal');
    controls.path.start('visible');
  },
  render: ({ size, controls }) => (
    <svg
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
      <motion.path
        animate={controls.path}
        d="M5 7 3 5"
        initial="visible"
        variants={RAY_LINE_VARIANTS}
      />
      <motion.path
        animate={controls.path}
        d="M9 6V3"
        initial="visible"
        variants={RAY_LINE_VARIANTS}
      />
      <motion.path
        animate={controls.path}
        d="m13 7 2-2"
        initial="visible"
        variants={RAY_LINE_VARIANTS}
      />
      <motion.g
        animate={controls.body}
        initial="normal"
        variants={PROJECTOR_BODY_VARIANTS}
      >
        <circle cx="9" cy="13" r="3" />
        <path d="M11.83 12H20a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2.17" />
        <path d="M16 16h2" />
      </motion.g>
    </svg>
  ),
});

export { ProjectorIcon };
