import { contrastRatio } from '@/tests/helpers/contrast';

describe('lesson edit UI contrast', () => {
  it('keeps Edited, save-error, and saved-toast pairs at WCAG AA', () => {
    expect(contrastRatio('#1A1A2E', '#FFE4EE')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#B91C1C', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#FCA5A5', '#171717')).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the inline saved confirmation at 4.5:1 in light and dark mode', () => {
    // text-emerald-700 on light page background
    expect(contrastRatio('#047857', '#FFFBF7')).toBeGreaterThanOrEqual(4.5);
    // dark:text-emerald-300 on dark page background
    expect(contrastRatio('#6EE7B7', '#171717')).toBeGreaterThanOrEqual(4.5);
  });
});
