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
});

describe('formatAcceptTypes', () => {
  it('turns an accept string into uppercase type labels', () => {
    expect(formatAcceptTypes('.pdf,.docx,.xlsx,.xls')).toBe('PDF, DOCX, XLSX, XLS');
    expect(formatAcceptTypes('.pdf,.docx,.xlsx,.jpg,.png')).toBe('PDF, DOCX, XLSX, JPG, PNG');
  });
});
