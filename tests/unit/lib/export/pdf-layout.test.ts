/**
 * @jest-environment node
 */
import { PDFDocument, type PDFFont } from 'pdf-lib';
import { embedPdfUnicodeFont } from '@/lib/export/pdf-fonts';
import {
  PDF_BULLET,
  firstStrongIsRtl,
  layoutPdfFieldText,
} from '@/lib/export/pdf-layout';

const BOUNDS = { x: 8, y: 8, width: 400, height: 300 };
const SIZE = 12;

function runsOfKind(
  lines: ReturnType<typeof layoutPdfFieldText>,
  kind: 'bullet' | 'text',
) {
  return lines.filter((line) => line.kind === kind);
}

describe('firstStrongIsRtl', () => {
  it('uses the first strong character, skipping the bullet', () => {
    expect(firstStrongIsRtl(`${PDF_BULLET} Students will learn`)).toBe(false);
    expect(firstStrongIsRtl(`${PDF_BULLET} التمثيل الضوئي`)).toBe(true);
    expect(firstStrongIsRtl('Exploring States of Matter')).toBe(false);
    expect(firstStrongIsRtl('التمثيل الضوئي')).toBe(true);
  });
});

describe('layoutPdfFieldText', () => {
  let font: PDFFont;

  beforeAll(async () => {
    const pdf = await PDFDocument.create();
    font = await embedPdfUnicodeFont(pdf);
  });

  it('places an LTR bullet at the left with text indented to its right', () => {
    const lines = layoutPdfFieldText(`${PDF_BULLET} Students will learn`, font, SIZE, BOUNDS);
    const [bullet] = runsOfKind(lines, 'bullet');
    const [text] = runsOfKind(lines, 'text');

    expect(bullet).toBeDefined();
    expect(text).toBeDefined();
    expect(bullet.text).toBe(PDF_BULLET);
    expect(text.text).toContain('Students');
    expect(bullet.x).toBeCloseTo(BOUNDS.x, 1);
    expect(text.x).toBeGreaterThan(bullet.x + bullet.width);
    expect(text.rtl).toBe(false);
  });

  it('places an RTL bullet at the right margin with text indented to its left', () => {
    const lines = layoutPdfFieldText(`${PDF_BULLET} التمثيل الضوئي`, font, SIZE, BOUNDS);
    const [bullet] = runsOfKind(lines, 'bullet');
    const [text] = runsOfKind(lines, 'text');

    expect(bullet).toBeDefined();
    expect(text).toBeDefined();
    expect(bullet.text).toBe(PDF_BULLET);
    expect(bullet.x + bullet.width).toBeCloseTo(BOUNDS.x + BOUNDS.width, 1);
    expect(text.x + text.width).toBeLessThanOrEqual(bullet.x + 0.5);
    expect(text.rtl).toBe(true);
    expect(text.y).toBeCloseTo(bullet.y, 1);
  });

  it('hangs wrapped RTL bullet continuations under the text, not under the bullet', () => {
    const narrow = { ...BOUNDS, width: 90 };
    const lines = layoutPdfFieldText(
      `${PDF_BULLET} التمثيل الضوئي في النباتات الخضراء خلال النهار`,
      font,
      SIZE,
      narrow,
    );
    const bullets = runsOfKind(lines, 'bullet');
    const texts = runsOfKind(lines, 'text');

    expect(texts.length).toBeGreaterThan(1);
    expect(bullets).toHaveLength(1);
    const textRight = texts[0].x + texts[0].width;
    for (const run of texts) {
      expect(run.x + run.width).toBeCloseTo(textRight, 1);
    }
    expect(bullets[0].x + bullets[0].width).toBeCloseTo(narrow.x + narrow.width, 1);
  });

  it('lays out a mixed list with LTR and RTL items independently', () => {
    const lines = layoutPdfFieldText(
      `${PDF_BULLET} Students will learn\n${PDF_BULLET} التمثيل الضوئي`,
      font,
      SIZE,
      BOUNDS,
    );
    const bullets = runsOfKind(lines, 'bullet');
    const texts = runsOfKind(lines, 'text');

    expect(bullets).toHaveLength(2);
    expect(texts).toHaveLength(2);
    expect(texts[0].text).toContain('Students');
    expect(texts[0].rtl).toBe(false);
    expect(bullets[0].x).toBeCloseTo(BOUNDS.x, 1);
    expect(texts[1].rtl).toBe(true);
    expect(bullets[1].x + bullets[1].width).toBeCloseTo(BOUNDS.x + BOUNDS.width, 1);
    expect(texts[0].y).toBeGreaterThan(texts[1].y);
  });
});
