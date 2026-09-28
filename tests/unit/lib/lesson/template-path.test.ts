import {
  getTemplateFileRejection,
  getTemplateUploadError,
  isFillableTemplatePath,
  isTemplateStoragePath,
} from '@/lib/lesson/template-path';

describe('template-path intake helpers', () => {
  it('accepts fillable extensions case-insensitively', () => {
    expect(isFillableTemplatePath('plan.DOCX')).toBe(true);
    expect(isFillableTemplatePath('user/template/plan.xlsx')).toBe(true);
    expect(isFillableTemplatePath('plan.xls')).toBe(true);
  });

  it('rejects PDF and other non-fillable names', () => {
    expect(isFillableTemplatePath('pr15-test.pdf')).toBe(false);
    expect(isFillableTemplatePath('notes.txt')).toBe(false);
    expect(getTemplateUploadError('pr15-test.pdf')).toBe(
      'Lesson plan templates need to be .docx, .xlsx, or .xls so we can fill them in. You uploaded a .pdf.',
    );
  });

  it('rejects PDFs by MIME even when the filename is missing an extension', () => {
    expect(
      getTemplateFileRejection({ name: 'pr15-test', type: 'application/pdf' }),
    ).toBe(
      'Lesson plan templates need to be .docx, .xlsx, or .xls so we can fill them in. You uploaded a .pdf.',
    );
  });

  it('rejects a PDF named like a template even if MIME is empty', () => {
    expect(getTemplateFileRejection({ name: 'pr15-test.pdf', type: '' })).toBe(
      'Lesson plan templates need to be .docx, .xlsx, or .xls so we can fill them in. You uploaded a .pdf.',
    );
  });

  it('treats storage paths under /template/ as template intake', () => {
    expect(isTemplateStoragePath('user-1/template/pr15-test.pdf')).toBe(true);
    expect(isTemplateStoragePath('user-1/curriculum_doc/unit.pdf')).toBe(false);
  });
});
