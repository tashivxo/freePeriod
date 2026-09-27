/**
 * Content-Disposition is a ByteString (Latin-1). Lesson titles often include
 * an em dash (U+2014) or ellipsis (U+2026); putting those characters in the
 * header throws in Node/undici and the download 500s after a successful fill.
 *
 * RFC 6266 / RFC 5987: an ASCII `filename` fallback plus `filename*=UTF-8''…`.
 */
export function contentDispositionAttachment(filename: string): string {
  const fallback = asciiFilenameFallback(filename);
  const encoded = encodeRfc5987Value(filename.trim() || fallback);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

/** Printable ASCII filename safe inside a quoted-string parameter. */
export function asciiFilenameFallback(filename: string): string {
  const mapped = (filename.trim() || 'download')
    .replace(/\u2014/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  let ascii = '';
  for (const char of mapped) {
    const code = char.charCodeAt(0);
    if (code < 32 || code > 126 || char === '"' || char === '\\') {
      ascii += '_';
      continue;
    }
    ascii += char;
  }

  const cleaned = ascii.replace(/_+/g, '_').replace(/^[\s._]+|[\s._]+$/g, '');
  return cleaned || 'download';
}

/** Percent-encode a filename* value (RFC 5987 attr-char left intact). */
export function encodeRfc5987Value(value: string): string {
  return encodeURIComponent(value).replace(/['()*]/g, (char) => {
    return `%${char.charCodeAt(0).toString(16).toUpperCase()}`;
  });
}
