"use client";

import type { Transition, Variants } from "motion/react";
import { motion } from "motion/react";

import { createAnimatedIcon } from "@/components/ui/icons/createAnimatedIcon";
import { ICON_MOTION } from "@/lib/motion/tokens";

const SVG_TRANSITION: Transition = {
  duration: 1,
  ease: ICON_MOTION.ease,
};

const SVG_VARIANTS: Variants = {
  normal: {
    rotate: 0,
    scale: 1,
  },
  animate: {
    rotate: [-3, 1, -2, 0],
    scale: [0.95, 1.05, 0.98, 1],
  },
};

const SHACKLE_TRANSITION: Transition = {
  duration: 0.3,
  ease: ICON_MOTION.ease,
};

const SHACKLE_VARIANTS: Variants = {
  normal: {
    pathLength: 1,
  },
  animate: {
    pathLength: 0.7,
  },
};

const LockIcon = createAnimatedIcon({
  displayName: "LockIcon",
  onActivate: (controls) => controls.start("animate"),
  onDeactivate: (controls) => controls.start("normal"),
  render: ({ size, controls }) => (
    <motion.svg
      animate={controls}
      fill="none"
      height={size}
      initial="normal"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      transition={SVG_TRANSITION}
      variants={SVG_VARIANTS}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
      <motion.path
        animate={controls}
        d="M7 11V7a5 5 0 0 1 10 0v4"
        initial="normal"
        transition={SHACKLE_TRANSITION}
        variants={SHACKLE_VARIANTS}
      />
    </motion.svg>
  ),
});

export { LockIcon };
