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
