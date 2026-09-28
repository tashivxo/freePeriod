import {
  DOCUMENT_STORAGE_READ_ERROR,
  TEMPLATE_STORAGE_READ_ERROR,
  isOwnedStoragePath,
  logStorageDownloadError,
  teacherStorageReadError,
} from '@/lib/parse/storage-download';

describe('teacherStorageReadError', () => {
  it('returns the template copy for template uploads', () => {
    expect(teacherStorageReadError('template', 'user-1/curriculum_doc/x.pdf')).toBe(
      TEMPLATE_STORAGE_READ_ERROR,
    );
    expect(TEMPLATE_STORAGE_READ_ERROR).toBe(
      'Couldn\u2019t read your template. Try uploading again.',
    );
  });

  it('returns the document copy for curriculum uploads', () => {
    expect(teacherStorageReadError('curriculum_doc', 'user-1/curriculum_doc/x.pdf')).toBe(
      DOCUMENT_STORAGE_READ_ERROR,
    );
    expect(DOCUMENT_STORAGE_READ_ERROR).toBe(
      'Couldn\u2019t read your document. Try uploading again.',
    );
  });

  it('infers template copy from a template storage path', () => {
    expect(teacherStorageReadError(undefined, 'user-1/template/plan.docx')).toBe(
      TEMPLATE_STORAGE_READ_ERROR,
    );
  });
});

describe('isOwnedStoragePath', () => {
  it('accepts paths under the authenticated user prefix', () => {
    expect(
      isOwnedStoragePath('user-1', 'user-1/template/Blank Daily English.docx'),
    ).toBe(true);
  });

  it('accepts a matching uploads row even without the user prefix', () => {
    expect(isOwnedStoragePath('user-1', 'legacy/blank.docx', 'legacy/blank.docx')).toBe(
      true,
    );
  });

  it('rejects another user prefix, traversal, and mismatched rows', () => {
    expect(isOwnedStoragePath('user-1', 'other-user/template/plan.docx')).toBe(false);
    expect(isOwnedStoragePath('user-1', 'user-1/../other/secret.docx')).toBe(false);
    expect(isOwnedStoragePath('user-1', '/user-1/template/plan.docx')).toBe(false);
    expect(isOwnedStoragePath('user-1', 'legacy/a.docx', 'legacy/b.docx')).toBe(false);
  });
});

describe('logStorageDownloadError', () => {
  it('logs the real storage message and status without throwing', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logStorageDownloadError({
      storagePath: 'user-1/template/plan.docx',
      uploadId: 'upload-1',
      uploadType: 'template',
      error: { message: 'Object not found', statusCode: '404' },
    });
    expect(spy).toHaveBeenCalledWith(
      '[parse-document] storage download failed',
      expect.objectContaining({
        message: 'Object not found',
        statusCode: '404',
        storagePath: 'user-1/template/plan.docx',
      }),
    );
    spy.mockRestore();
  });
});
