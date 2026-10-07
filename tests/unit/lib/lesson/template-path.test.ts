import {
  FILLABLE_TEMPLATE_ACCEPT,
  getTemplateFileRejection,
  getTemplateUploadError,
  isFillableTemplatePath,
  isTemplateStoragePath,
} from '@/lib/lesson/template-path';

describe('template-path intake helpers', () => {
  it('accepts fillable extensions case-insensitively, including PDF', () => {
    expect(isFillableTemplatePath('plan.DOCX')).toBe(true);
    expect(isFillableTemplatePath('user/template/plan.xlsx')).toBe(true);
    expect(isFillableTemplatePath('plan.xls')).toBe(true);
    expect(isFillableTemplatePath('pr15-test.pdf')).toBe(true);
    expect(isFillableTemplatePath('user-1/template/plan.PDF')).toBe(true);
  });

  it('exposes PDF in the file-picker accept list', () => {
    expect(FILLABLE_TEMPLATE_ACCEPT).toBe('.pdf,.docx,.xlsx,.xls');
  });

  it('rejects other non-fillable names', () => {
    expect(isFillableTemplatePath('notes.txt')).toBe(false);
    expect(isFillableTemplatePath('scan.png')).toBe(false);
    expect(getTemplateUploadError('notes.txt')).toBe(
      'Lesson plan templates need to be .pdf, .docx, .xlsx, or .xls so we can fill them in. You uploaded a .txt.',
    );
  });

  it('accepts PDFs by MIME even when the filename is missing an extension', () => {
    expect(getTemplateFileRejection({ name: 'pr15-test', type: 'application/pdf' })).toBeNull();
  });

  it('accepts a PDF named like a template even if MIME is empty', () => {
    expect(getTemplateFileRejection({ name: 'pr15-test.pdf', type: '' })).toBeNull();
  });

  it('still rejects images and plain text as templates', () => {
    expect(
      getTemplateFileRejection({ name: 'scan.png', type: 'image/png' }),
    ).toBe(
      'Lesson plan templates need to be .pdf, .docx, .xlsx, or .xls so we can fill them in. You uploaded a .png.',
    );
    expect(
      getTemplateFileRejection({ name: 'notes.txt', type: 'text/plain' }),
    ).toBe(
      'Lesson plan templates need to be .pdf, .docx, .xlsx, or .xls so we can fill them in. You uploaded a .txt.',
    );
  });

  it('treats storage paths under /template/ as template intake', () => {
    expect(isTemplateStoragePath('user-1/template/pr15-test.pdf')).toBe(true);
    expect(isTemplateStoragePath('user-1/curriculum_doc/unit.pdf')).toBe(false);
  });
});
