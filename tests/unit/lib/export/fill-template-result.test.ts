import { FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL } from '@/lib/export/copy';
import * as FillResult from '@/lib/export/fill-template-result';
import {
  isMeaningfulFill,
  templateDataAppearsInText,
} from '@/lib/export/fill-template-result';

describe('isMeaningfulFill', () => {
  it('rejects zero fills', () => {
    expect(isMeaningfulFill(0, [])).toBe(false);
    expect(isMeaningfulFill(0, ['objectives'])).toBe(false);
  });

  it('rejects fills that only wrote the hardcoded Materials/Resources default', () => {
    expect(isMeaningfulFill(1, ['materials'])).toBe(false);
    expect(isMeaningfulFill(2, ['Resources', 'materials'])).toBe(false);
  });

  it('rejects fills that only wrote header fields such as title and duration', () => {
    expect(isMeaningfulFill(2, ['lesson title', 'duration'])).toBe(false);
    expect(isMeaningfulFill(3, ['materials', 'lesson title', 'duration'])).toBe(false);
    expect(isMeaningfulFill(1, ['topic'])).toBe(false);
  });

  it('accepts a fill that wrote at least one body field', () => {
    expect(isMeaningfulFill(1, ['objectives'])).toBe(true);
    expect(isMeaningfulFill(1, ['essential questions'])).toBe(true);
    expect(isMeaningfulFill(2, ['lesson title', 'learning objectives'])).toBe(true);
    expect(isMeaningfulFill(2, ['duration', 'new vocabulary'])).toBe(true);
  });
});

describe('TEMPLATE_UNFILLED_NO_PDF_FIELDS_ERROR', () => {
  it('describes a PDF with no fillable fields and names the current download action', () => {
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
    expect(FillResult.TEMPLATE_UNFILLED_NO_PDF_FIELDS_ERROR).not.toContain(
      'some sections didn’t map',
    );
  });
});

describe('templateDataAppearsInText', () => {
  it('returns false when no non-trivial values appear', () => {
    expect(
      templateDataAppearsInText('empty template', {
        title: '',
        hook: 'Hi',
      }),
    ).toBe(false);
  });

  it('returns true when a lesson value is present in the document text', () => {
    expect(
      templateDataAppearsInText(
        'Lesson: Exploring States of Matter and particle motion',
        { title: 'Exploring States of Matter' },
      ),
    ).toBe(true);
  });
});
