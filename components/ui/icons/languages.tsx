"use client";

import type { Variants } from "motion/react";
import { motion } from "motion/react";

import { createMultiControlAnimatedIcon } from "@/components/ui/icons/createAnimatedIcon";

const PATH_VARIANTS: Variants = {
  normal: { opacity: 1, pathLength: 1, pathOffset: 0 },
  animate: (custom: number) => ({
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [1, 0],
    transition: {
      opacity: { delay: custom * 0.1 },
      pathLength: { type: "spring", stiffness: 70, damping: 10 },
    },
  }),
};

const LanguagesIcon = createMultiControlAnimatedIcon({
  displayName: "LanguagesIcon",
  controlKeys: ["latin", "script"],
  onActivate: (controls) => {
    controls.latin.start("animate");
    controls.script.start("animate");
  },
  onDeactivate: (controls) => {
    controls.latin.start("normal");
    controls.script.start("normal");
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
        animate={controls.latin}
        custom={0}
        d="M7 2h1"
        variants={PATH_VARIANTS}
      />
      <motion.path
        animate={controls.latin}
        custom={1}
        d="M2 5h12"
        variants={PATH_VARIANTS}
      />
      <motion.path
        animate={controls.latin}
        custom={2}
        d="m4 14 6-6 3-3"
        variants={PATH_VARIANTS}
      />
      <motion.path
        animate={controls.latin}
        custom={3}
        d="m5 8 6 6"
        variants={PATH_VARIANTS}
      />
      <motion.path
        animate={controls.script}
        custom={3}
        d="m22 22-5-10-5 10"
        variants={PATH_VARIANTS}
      />
      <motion.path
        animate={controls.script}
        custom={3}
        d="M14 18h6"
        variants={PATH_VARIANTS}
      />
    </svg>
  ),
});

export { LanguagesIcon };
