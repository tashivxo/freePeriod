import {
  FILL_MY_TEMPLATE_LABEL,
  FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE,
  FILLED_TEMPLATE_NOT_FILLABLE_MESSAGE,
  FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE,
  FILLED_TEMPLATE_PDF_MESSAGE,
} from '@/features/lesson/components/filled-template-copy';
import { TEMPLATE_UNFILLED_ERROR } from '@/lib/export/fill-template-result';

describe('Fill my template copy', () => {
  it('uses the approved toolbar label and question punctuation', () => {
    expect(FILL_MY_TEMPLATE_LABEL).toBe('Fill my template');

    expect(FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE).toMatch(/\?$/);
    expect(FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE).toMatch(/\?$/);
    expect(FILLED_TEMPLATE_PDF_MESSAGE).toMatch(/\?$/);
    expect(FILLED_TEMPLATE_NOT_FILLABLE_MESSAGE).toMatch(/\?$/);
  });

  it('uses Free Period branding instead of the legacy compact spelling', () => {
    expect(TEMPLATE_UNFILLED_ERROR).toContain('Free Period');
    expect(TEMPLATE_UNFILLED_ERROR).not.toContain('FreePeriod');
  });
});
