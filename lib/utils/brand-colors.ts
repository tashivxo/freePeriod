import { hexToOklch, maxSrgbChroma, oklchToHex } from '@/lib/utils/oklch';

/**
 * Brand color constants — single source of truth for contexts that cannot use
 * CSS variables (react-pdf/renderer, WebGL shaders, icon metadata generators).
 *
 * For everything else, use the Tailwind utilities (`bg-coral`, `text-mustard`, …)
 * or CSS custom properties (`var(--color-coral)`, `var(--color-mustard)`, …).
 */

// ---------------------------------------------------------------------------
// Primitive tokens
// ---------------------------------------------------------------------------

export const CORAL = '#FF8BB0' as const;
export const CORAL_LIGHT = '#FFB8D0' as const;
export const CORAL_DARK = '#E5709A' as const;

export const MUSTARD = '#F7C34B' as const;
export const MUSTARD_LIGHT = '#FADB8A' as const;
export const MUSTARD_DARK = '#D4A52E' as const;

const coralOklch = hexToOklch(CORAL);
const mustardOklch = hexToOklch(MUSTARD);

// Same share of each hue's sRGB max chroma, so rose, peach and gold read
// equally vivid. L >= 0.86 keeps #1A1A2E body text at APCA Lc 75+ on any band.
export const COLOR_BENDS_CHROMA_SHARE = 0.88;

function atmosphereStop(hue: number, lightness: number): string {
  return oklchToHex({
    l: lightness,
    c: maxSrgbChroma(lightness, hue) * COLOR_BENDS_CHROMA_SHARE,
    h: hue,
  });
}

// Vivid peach (mustard L/C at hue 40). sRGB clips chroma at this L/H.
export const PEACH_BRIDGE = oklchToHex({
  l: mustardOklch.l,
  c: mustardOklch.c,
  h: 40,
});

// ColorBends atmosphere stops: brand hues, mid-high L. Not UI tokens.
export const COLOR_BENDS_ROSE = atmosphereStop(coralOklch.h, 0.86);
export const COLOR_BENDS_PEACH = atmosphereStop(40, 0.875);
export const COLOR_BENDS_GOLD = atmosphereStop(mustardOklch.h, 0.89);

export const BACKGROUND = '#FFFBF7' as const;
export const SURFACE = '#FFFFFF' as const;

export const TEXT_PRIMARY = '#1A1A2E' as const;
export const TEXT_SECONDARY = '#6B7280' as const;

export const BORDER = '#E5E7EB' as const;

export const SUCCESS = '#10B981' as const;
export const ERROR = '#EF4444' as const;

// ---------------------------------------------------------------------------
// Convenience object — useful when iterating or indexing by key
// ---------------------------------------------------------------------------

export const BRAND_COLORS = {
  coral: CORAL,
  coralLight: CORAL_LIGHT,
  coralDark: CORAL_DARK,
  mustard: MUSTARD,
  mustardLight: MUSTARD_LIGHT,
  mustardDark: MUSTARD_DARK,
  background: BACKGROUND,
  surface: SURFACE,
  textPrimary: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
  border: BORDER,
  success: SUCCESS,
  error: ERROR,
} as const;

export type BrandColorKey = keyof typeof BRAND_COLORS;

// ---------------------------------------------------------------------------
// ColorBends atmospheric palettes (app shell shader only)
// Swap COLOR_BENDS_DEFAULT_OPTION to A, B, or C.
// ---------------------------------------------------------------------------

export const COLOR_BENDS_PALETTES = {
  A: [CORAL_LIGHT, CORAL, MUSTARD_LIGHT, MUSTARD],
  B: [CORAL_LIGHT, CORAL, CORAL_DARK],
  C: [COLOR_BENDS_ROSE, COLOR_BENDS_PEACH, COLOR_BENDS_GOLD],
} as const;

export const COLOR_BENDS_DEFAULT_OPTION = 'C' satisfies keyof typeof COLOR_BENDS_PALETTES;
export const COLOR_BENDS_PALETTE = COLOR_BENDS_PALETTES[COLOR_BENDS_DEFAULT_OPTION];

export type ColorBendsAtmosphere = 'brand' | 'rainbow';
export const COLOR_BENDS_ATMOSPHERE_STORAGE_KEY = 'fp-color-bends-atmosphere';

// The shader multiplies band color by intensity (toward black), so light mode
// stays at 1 to avoid greying the stops; dark mode dims them into glows.
export const COLOR_BENDS_INTENSITY = {
  light: 1,
  dark: 0.45,
} as const;
