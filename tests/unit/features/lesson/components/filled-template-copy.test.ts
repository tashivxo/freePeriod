import {
  BTN_FILL_TEMPLATE,
  FILL_MY_TEMPLATE_LABEL,
  FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE,
  FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE,
} from '@/features/lesson/components/filled-template-copy';
import { TEMPLATE_UNFILLED_ERROR } from '@/lib/export/fill-template-result';

describe('Fill my template copy', () => {
  it('uses the approved toolbar label and question punctuation', () => {
    expect(FILL_MY_TEMPLATE_LABEL).toBe('Fill my template');

    expect(BTN_FILL_TEMPLATE).toBe('Fill template');
    expect(FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE).toBe(
      'Fill using the template you uploaded.',
    );
    expect(FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE).toMatch(/\?$/);
    expect(FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE).toBe(
      'You haven’t uploaded a lesson plan template. Upload a PDF, DOCX or XLSX to fill?',
    );
  });

  it('uses Free Period branding and the Free Period template download label in unfilled copy', () => {
    expect(TEMPLATE_UNFILLED_ERROR).toBe(
      'Couldn’t fill this template — some sections didn’t map. Use Free Period template for a Free Period lesson plan, or re-upload yours.',
    );
    expect(TEMPLATE_UNFILLED_ERROR).toContain(
      'Use Free Period template for a Free Period lesson plan',
    );
    expect(TEMPLATE_UNFILLED_ERROR).not.toContain('Free Period Template');
    expect(TEMPLATE_UNFILLED_ERROR).not.toContain('free period template');
    expect(TEMPLATE_UNFILLED_ERROR).not.toContain('Download lesson plan (FreePeriod template)');
    expect(TEMPLATE_UNFILLED_ERROR).not.toContain('Download DOCX');
    expect(FILL_MY_TEMPLATE_LABEL).toBe('Fill my template');
  });
});
