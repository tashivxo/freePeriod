"use client";

import type { Transition, Variants } from "motion/react";
import { motion } from "motion/react";

import { createAnimatedIcon } from "@/components/icons/createAnimatedIcon";

const SVG_VARIANTS: Variants = {
  normal: {
    rotate: 0,
  },
  animate: {
    rotate: [0, -10, 10, -5, 5, 0],
  },
};

const SVG_TRANSITION: Transition = {
  duration: 1.2,
  ease: "easeInOut",
};

const MoonIcon = createAnimatedIcon({
  displayName: "MoonIcon",
  onActivate: (controls) => controls.start("animate"),
  onDeactivate: (controls) => controls.start("normal"),
  render: ({ size, controls }) => (
    <motion.svg
      animate={controls}
      fill="none"
      height={size}
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
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </motion.svg>
  ),
});

export { MoonIcon };
