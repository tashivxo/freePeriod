import { contrastRatio } from '@/tests/helpers/contrast';

describe('lesson edit UI contrast', () => {
  it('keeps Edited, save-error, and saved-toast pairs at WCAG AA', () => {
    expect(contrastRatio('#1A1A2E', '#FFE4EE')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#B91C1C', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#047857', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#FCA5A5', '#171717')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#6EE7B7', '#171717')).toBeGreaterThanOrEqual(4.5);
  });
});
