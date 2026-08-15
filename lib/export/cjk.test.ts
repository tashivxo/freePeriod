import { containsCjk, ensureEastAsiaRFonts, DOCX_EAST_ASIA_FONT } from './cjk';

describe('CJK export helpers', () => {
  it('detects Simplified Chinese text', () => {
    expect(containsCjk('能量转化')).toBe(true);
    expect(containsCjk('Energy')).toBe(false);
  });

  it('injects eastAsia Microsoft YaHei into empty rPr', () => {
    const out = ensureEastAsiaRFonts('<w:rPr></w:rPr>');
    expect(out).toContain(`w:eastAsia="${DOCX_EAST_ASIA_FONT}"`);
  });

  it('creates rPr with eastAsia when input is empty', () => {
    const out = ensureEastAsiaRFonts('');
    expect(out).toContain(`w:eastAsia="${DOCX_EAST_ASIA_FONT}"`);
    expect(out).toContain('<w:rPr>');
  });
});
