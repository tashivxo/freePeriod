import {
  DEFAULT_MAX_UPLOAD_BYTES,
  formatAcceptTypes,
  formatFileSize,
} from '@/lib/utils/file-input';

describe('formatFileSize', () => {
  it('formats bytes, kilobytes, and megabytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(2.4 * 1024 * 1024)).toBe('2.4 MB');
    expect(formatFileSize(DEFAULT_MAX_UPLOAD_BYTES)).toBe('10 MB');
  });

  it('keeps Arabic sizes from rendering as MB 10', () => {
    const ar = formatFileSize(DEFAULT_MAX_UPLOAD_BYTES, 'ar');
    expect(ar).toMatch(/\u2068/);
    expect(ar).toMatch(/\u2069/);
    expect(ar.indexOf('10')).toBeGreaterThan(-1);
    expect(ar.indexOf('10')).toBeLessThan(ar.indexOf('MB'));
    expect(ar).not.toMatch(/^MB/);
  });
});

describe('formatAcceptTypes', () => {
  it('turns an accept string into uppercase type labels', () => {
    expect(formatAcceptTypes('.pdf,.docx,.xlsx,.xls')).toBe('PDF, DOCX, XLSX, XLS');
    expect(formatAcceptTypes('.pdf,.docx,.xlsx,.jpg,.png')).toBe('PDF, DOCX, XLSX, JPG, PNG');
  });

  it('uses the translated files suffix for wildcard types', () => {
    expect(formatAcceptTypes('image/*')).toBe('IMAGE files');
    expect(formatAcceptTypes('image/*', 'ملفات')).toBe('IMAGE ملفات');
    expect(formatAcceptTypes('image/*', 'archivos')).toBe('IMAGE archivos');
  });
});
