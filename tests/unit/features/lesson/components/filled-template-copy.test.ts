import {
  BTN_FILL_TEMPLATE,
  FILL_MY_TEMPLATE_LABEL,
  FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE,
  FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE,
} from '@/features/lesson/components/filled-template-copy';
import { FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL } from '@/lib/export/copy';
import { TEMPLATE_UNFILLED_ERROR } from '@/lib/export/fill-template-result';
import * as FillResult from '@/lib/export/fill-template-result';

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
      'Couldn’t fill this template, some sections didn’t map. Use Free Period template for a Free Period lesson plan, or re-upload yours.',
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

  it('names the current download action in PDF no-fields unfilled copy', () => {
    expect(FillResult).toHaveProperty(
      'TEMPLATE_UNFILLED_NO_PDF_FIELDS_ERROR',
      `Couldn’t fill this PDF, it has no fillable form fields. Upload a Word (.docx) version of your template, or use ${FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL} for a Free Period lesson plan.`,
    );
    expect(FillResult.TEMPLATE_UNFILLED_NO_PDF_FIELDS_ERROR).toContain(
      'use Free Period template for a Free Period lesson plan',
    );
    expect(FillResult.TEMPLATE_UNFILLED_NO_PDF_FIELDS_ERROR).not.toContain('Free Period Template');
    expect(FillResult.TEMPLATE_UNFILLED_NO_PDF_FIELDS_ERROR).not.toContain('free period template');
    expect(FillResult.TEMPLATE_UNFILLED_NO_PDF_FIELDS_ERROR).not.toContain(
      'Download lesson plan (FreePeriod template)',
    );
    expect(FillResult.TEMPLATE_UNFILLED_NO_PDF_FIELDS_ERROR).not.toContain('Download DOCX');
  });
});
