export const ICON_MOTION = {
  duration: {
    fast: 0.2,
    normal: 0.6,
  },
  ease: [0.4, 0, 0.2, 1] as const,
} as const;

/** CSS ms — keep in sync with `--text-swap-*` in app/globals.css */
export const TEXT_SWAP = {
  enterMs: 200,
  exitMs: 120,
  translateY: 8,
  blur: 2,
} as const;

/** CSS ms — keep in sync with `--dropdown-*-dur` in app/globals.css */
export const DROPDOWN_MOTION = {
  openMs: 250,
  closeMs: 150,
} as const;
