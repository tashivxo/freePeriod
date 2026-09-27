import {
  asciiFilenameFallback,
  contentDispositionAttachment,
  encodeRfc5987Value,
} from '@/lib/export/content-disposition';

const UNICODE_TITLE = 'Fractions — sharing equally…-filled.docx';

describe('content disposition filenames', () => {
  it('keeps an ASCII filename inside a quoted parameter', () => {
    expect(contentDispositionAttachment('Story Elements-filled.docx')).toBe(
      `attachment; filename="Story Elements-filled.docx"; filename*=UTF-8''Story%20Elements-filled.docx`,
    );
  });

  it('uses an ASCII fallback and RFC 5987 filename* for em dash and ellipsis', () => {
    const header = contentDispositionAttachment(UNICODE_TITLE);

    expect(header).toContain('filename="Fractions - sharing equally...-filled.docx"');
    expect(header).toContain(`filename*=UTF-8''${encodeRfc5987Value(UNICODE_TITLE)}`);
    expect(header).toContain('%E2%80%94');
    expect(header).toContain('%E2%80%A6');
    expect([...header].every((char) => char.charCodeAt(0) <= 255)).toBe(true);
    expect(() => new Headers({ 'Content-Disposition': header })).not.toThrow();
  });

  it('documents that a raw Unicode filename is not a ByteString', () => {
    const raw = `attachment; filename="${UNICODE_TITLE}"`;
    expect(() => new Headers({ 'Content-Disposition': raw })).toThrow(TypeError);
  });

  it('strips quotes and controls from the ASCII fallback', () => {
    expect(asciiFilenameFallback('Plan "A"\r\n-filled.docx')).toBe('Plan _A_-filled.docx');
  });
});
