"use client";

import type { Transition, Variants } from "motion/react";
import { motion } from "motion/react";

import { createAnimatedIcon } from "@/components/icons/createAnimatedIcon";
import { ICON_MOTION } from "@/lib/motion/tokens";

const HAND_TRANSITION: Transition = {
  duration: ICON_MOTION.duration.normal,
  ease: ICON_MOTION.ease,
};

const HAND_VARIANTS: Variants = {
  normal: {
    rotate: 0,
    originX: "0%",
    originY: "100%",
  },
  animate: {
    rotate: 360,
    originX: "0%",
    originY: "100%",
  },
};

const MINUTE_HAND_TRANSITION: Transition = {
  duration: 0.5,
  ease: "easeInOut",
};

const MINUTE_HAND_VARIANTS: Variants = {
  normal: {
    rotate: 0,
    originX: "0%",
    originY: "100%",
  },
  animate: {
    rotate: 45,
    originX: "0%",
    originY: "100%",
  },
};

const ClockIcon = createAnimatedIcon({
  displayName: "ClockIcon",
  onActivate: (controls) => controls.start("animate"),
  onDeactivate: (controls) => controls.start("normal"),
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
      <circle cx="12" cy="12" r="10" />
      <motion.line
        animate={controls}
        initial="normal"
        transition={HAND_TRANSITION}
        variants={HAND_VARIANTS}
        x1="12"
        x2="12"
        y1="12"
        y2="6"
      />
      <motion.line
        animate={controls}
        initial="normal"
        transition={MINUTE_HAND_TRANSITION}
        variants={MINUTE_HAND_VARIANTS}
        x1="12"
        x2="16"
        y1="12"
        y2="12"
      />
    </svg>
  ),
});

export { ClockIcon };
