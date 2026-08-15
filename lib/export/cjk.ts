const CJK_RE = /[\u3400-\u9FFF\uF900-\uFAFF]/;

export function containsCjk(text: string): boolean {
  return CJK_RE.test(text);
}

export const DOCX_LATIN_FONT = 'Calibri';
export const DOCX_EAST_ASIA_FONT = 'Microsoft YaHei';

export const DOCX_RUN_FONT = {
  ascii: DOCX_LATIN_FONT,
  hAnsi: DOCX_LATIN_FONT,
  eastAsia: DOCX_EAST_ASIA_FONT,
} as const;

export function ensureEastAsiaRFonts(rPrXml: string): string {
  if (/w:eastAsia=/.test(rPrXml)) {
    return rPrXml.replace(/w:eastAsia="[^"]*"/, `w:eastAsia="${DOCX_EAST_ASIA_FONT}"`);
  }
  if (/<w:rFonts\b[^/]*\/>/.test(rPrXml)) {
    return rPrXml.replace(
      /<w:rFonts\b([^/]*)\/>/,
      `<w:rFonts$1 w:eastAsia="${DOCX_EAST_ASIA_FONT}"/>`,
    );
  }
  if (/<w:rFonts\b[^>]*>/.test(rPrXml)) {
    return rPrXml.replace(
      /<w:rFonts\b([^>]*)>/,
      `<w:rFonts$1 w:eastAsia="${DOCX_EAST_ASIA_FONT}">`,
    );
  }
  return rPrXml.replace(
    /<w:rPr>/,
    `<w:rPr><w:rFonts w:ascii="${DOCX_LATIN_FONT}" w:hAnsi="${DOCX_LATIN_FONT}" w:eastAsia="${DOCX_EAST_ASIA_FONT}"/>`,
  );
}
