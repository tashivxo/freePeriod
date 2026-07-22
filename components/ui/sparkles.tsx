"use client";

import type { Variants } from "motion/react";
import { motion } from "motion/react";

import { createMultiControlAnimatedIcon } from "@/components/icons/createAnimatedIcon";
import { ICON_MOTION } from "@/lib/motion/tokens";

const SPARKLE_VARIANTS: Variants = {
  initial: {
    y: 0,
    fill: "none",
  },
  hover: {
    y: [0, -1, 0, 0],
    fill: "currentColor",
    transition: {
      duration: ICON_MOTION.duration.normal,
      bounce: 0.3,
    },
  },
};

const STAR_VARIANTS: Variants = {
  initial: {
    opacity: 1,
    x: 0,
    y: 0,
  },
  blink: () => ({
    opacity: [0, 1, 0],
    transition: {
      duration: ICON_MOTION.duration.normal,
      type: "spring",
      stiffness: 70,
      damping: 10,
      mass: 0.4,
    },
  }),
};

const SparklesIcon = createMultiControlAnimatedIcon({
  displayName: "SparklesIcon",
  controlKeys: ["sparkle", "star"],
  onActivate: (controls) => {
    controls.sparkle.start("hover");
    controls.star.start("blink");
  },
  onDeactivate: (controls) => {
    controls.sparkle.start("initial");
    controls.star.start("initial");
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
        animate={controls.sparkle}
        d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
        variants={SPARKLE_VARIANTS}
      />
      <motion.path animate={controls.star} d="M20 3v4" variants={STAR_VARIANTS} />
      <motion.path animate={controls.star} d="M22 5h-4" variants={STAR_VARIANTS} />
      <motion.path animate={controls.star} d="M4 17v2" variants={STAR_VARIANTS} />
      <motion.path animate={controls.star} d="M5 18H3" variants={STAR_VARIANTS} />
    </svg>
  ),
});

export { SparklesIcon };
