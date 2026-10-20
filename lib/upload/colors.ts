/** Darkened coral for light-mode links. 6.42:1 on white, 5.02:1 on the drag tint. */
export const UPLOAD_ACTION_COLOR_LIGHT = '#A33760';
/** Coral-300 for dark-mode links. 11.11:1 on #171717, 5.79:1 on the drag tint. */
export const UPLOAD_ACTION_COLOR_DARK = '#FFB8D0';
export const UPLOAD_DRAG_BORDER_LIGHT = '#B5486F';
export const UPLOAD_DRAG_BORDER_DARK = '#FF8BB0';
export const UPLOAD_ERROR_COLOR_LIGHT = '#B91C1C';
export const UPLOAD_ERROR_COLOR_DARK = '#FCA5A5';
export const UPLOAD_DRAG_BACKGROUND =
  'color-mix(in srgb, var(--color-coral) 32%, var(--color-surface))';

// Tailwind only emits CSS for complete class literals — do not interpolate hex constants.
export const UPLOAD_ACTION_COLOR_CLASS = 'text-[#A33760] dark:text-[#FFB8D0]';
export const UPLOAD_ERROR_TEXT_CLASS = 'text-[#B91C1C] dark:text-[#FCA5A5]';
export const UPLOAD_DRAG_FOCUS_CLASS =
  'focus-visible:outline-[#B5486F] dark:focus-visible:outline-[#FF8BB0]';
export const UPLOAD_DRAG_ACTIVE_BORDER_CLASS =
  'border-solid border-[#B5486F] dark:border-[#FF8BB0]';
