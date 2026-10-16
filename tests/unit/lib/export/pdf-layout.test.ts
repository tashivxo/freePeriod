/**
 * @jest-environment node
 */
import { createRequire } from 'node:module';
import { PDFDocument, type PDFFont } from 'pdf-lib';
import { embedPdfUnicodeFont } from '@/lib/export/pdf-fonts';
import {
  PDF_BULLET,
  PDF_LINE_HEIGHT_RATIO,
  PDF_MULTILINE_FONT_SIZE,
  PDF_SINGLE_FONT_SIZE,
  firstStrongIsRtl,
  fitPdfFieldFontSize,
  layoutPdfFieldText,
} from '@/lib/export/pdf-layout';

const require = createRequire(import.meta.url);
const { ArabicShaper } = require('arabic-persian-reshaper') as {
  ArabicShaper: { convertArabic: (text: string) => string };
};
const bidiFactory = require('bidi-js') as () => {
  getEmbeddingLevels: (text: string, dir?: 'ltr' | 'rtl' | 'auto') => unknown;
  getReorderedString: (text: string, levels: unknown) => string;
};
const bidi = bidiFactory();

const BOUNDS = { x: 8, y: 8, width: 400, height: 300 };
const SIZE = 12;

function runsOfKind(
  lines: ReturnType<typeof layoutPdfFieldText>,
  kind: 'bullet' | 'text',
) {
  return lines.filter((line) => line.kind === kind);
}

function onceVisual(logical: string): string {
  const shaped = ArabicShaper.convertArabic(logical);
  return bidi.getReorderedString(shaped, bidi.getEmbeddingLevels(shaped));
}

function twiceVisual(logical: string): string {
  const once = onceVisual(logical);
  return bidi.getReorderedString(once, bidi.getEmbeddingLevels(once));
}

describe('firstStrongIsRtl', () => {
  it('uses the first strong character, skipping the bullet', () => {
    expect(firstStrongIsRtl(`${PDF_BULLET} Students will learn`)).toBe(false);
    expect(firstStrongIsRtl(`${PDF_BULLET} التمثيل الضوئي`)).toBe(true);
    expect(firstStrongIsRtl('Exploring States of Matter')).toBe(false);
    expect(firstStrongIsRtl('التمثيل الضوئي')).toBe(true);
  });
});

describe('layoutPdfFieldText drawn visual order', () => {
  let font: PDFFont;

  beforeAll(async () => {
    const pdf = await PDFDocument.create();
    font = await embedPdfUnicodeFont(pdf);
  });

  it('reorders a pure-Arabic line exactly once (not twice)', () => {
    const logical = 'التمثيل الضوئي';
    const drawn = runsOfKind(layoutPdfFieldText(logical, font, SIZE, BOUNDS), 'text')
      .map((run) => run.text)
      .join('');
    expect(drawn).toBe(onceVisual(logical));
    expect(drawn).not.toBe(twiceVisual(logical));
    expect(drawn).not.toBe(logical);
  });

  it('keeps digits and Latin LTR inside an Arabic line and does not reverse them', () => {
    const logical = 'العام 2026 فيه 45 طالبا (particles)';
    const drawn = runsOfKind(layoutPdfFieldText(logical, font, SIZE, BOUNDS), 'text')
      .map((run) => run.text)
      .join('');
    expect(drawn).toContain('2026');
    expect(drawn).toContain('45');
    expect(drawn).not.toContain('6202');
    expect(drawn).not.toMatch(/(^|[^0-9])54([^0-9]|$)/);
    expect(drawn).toContain('particles');
    expect(drawn).not.toContain('selcitrap');
  });

  it('wraps Arabic in logical order then bidi-reorders each visual line', () => {
    const logical = 'واحد اثنان ثلاثة اربعة خمسة ستة سبعة ثمانية';
    const narrow = { x: 0, y: 0, width: 72, height: 400 };
    const texts = runsOfKind(layoutPdfFieldText(logical, font, SIZE, narrow), 'text');
    expect(texts.length).toBeGreaterThan(1);
    expect(texts[0].text).toContain(onceVisual('واحد'));
    expect(texts[0].text).not.toContain(onceVisual('ثمانية'));
    expect(texts[texts.length - 1].text).toContain(onceVisual('ثمانية'));
  });

  it('does not split mixed lines that end in Arabic onto the wrong visual lines', () => {
    const logical = 'Climate change and التمثيل الضوئي in arid regions';
    const narrow = { x: 0, y: 0, width: 120, height: 400 };
    const texts = runsOfKind(layoutPdfFieldText(logical, font, SIZE, narrow), 'text');
    expect(texts.length).toBeGreaterThan(1);
    expect(texts[0].text.startsWith('Climate')).toBe(true);
    expect(texts[0].text).not.toMatch(/^[^\u0020]*[ﻰﻱﻲ]/);
  });

  it('places an LTR bullet at the left with text indented to its right', () => {
    const lines = layoutPdfFieldText(`${PDF_BULLET} Students will learn`, font, SIZE, BOUNDS);
    const [bullet] = runsOfKind(lines, 'bullet');
    const [text] = runsOfKind(lines, 'text');

    expect(bullet).toBeDefined();
    expect(text).toBeDefined();
    expect(bullet.text).toBe(PDF_BULLET);
    expect(text.text).toBe('Students will learn');
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
    expect(text.text).toBe(onceVisual('التمثيل الضوئي'));
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
    expect(texts[0].text).toBe('Students will learn');
    expect(texts[0].rtl).toBe(false);
    expect(bullets[0].x).toBeCloseTo(BOUNDS.x, 1);
    expect(texts[1].text).toBe(onceVisual('التمثيل الضوئي'));
    expect(texts[1].rtl).toBe(true);
    expect(bullets[1].x + bullets[1].width).toBeCloseTo(BOUNDS.x + BOUNDS.width, 1);
    expect(texts[0].y).toBeGreaterThan(texts[1].y);
  });

  it('strips a leading hyphen marker and draws U+2022 instead of "- - "', () => {
    const lines = layoutPdfFieldText('- Students will learn', font, SIZE, BOUNDS);
    const [bullet] = runsOfKind(lines, 'bullet');
    const [text] = runsOfKind(lines, 'text');
    expect(bullet.text).toBe('\u2022');
    expect(text.text).toBe('Students will learn');
    expect(text.text).not.toMatch(/^- /);
  });

  it.each(['- Students will learn', '* Students will learn', '• Students will learn'])(
    'strips a leading %j marker and draws only U+2022',
    (input) => {
      const lines = layoutPdfFieldText(input, font, SIZE, BOUNDS);
      const [bullet] = runsOfKind(lines, 'bullet');
      const [text] = runsOfKind(lines, 'text');
      expect(bullet.text).toBe('\u2022');
      expect(text.text).toBe('Students will learn');
      expect(text.text).not.toMatch(/^[-*\u2022] /);
    },
  );
});

describe('fitPdfFieldFontSize', () => {
  let font: PDFFont;

  beforeAll(async () => {
    const pdf = await PDFDocument.create();
    font = await embedPdfUnicodeFont(pdf);
  });

  it('uses one fixed size per field type when the text fits', () => {
    const bounds = { x: 8, y: 8, width: 400, height: 240 };
    expect(fitPdfFieldFontSize('• Short', font, bounds, 'multiline')).toBe(PDF_MULTILINE_FONT_SIZE);
    expect(fitPdfFieldFontSize('• Also short enough', font, bounds, 'multiline')).toBe(
      PDF_MULTILINE_FONT_SIZE,
    );
    expect(fitPdfFieldFontSize('Title', font, bounds, 'single')).toBe(PDF_SINGLE_FONT_SIZE);
  });

  it('spaces wrapped lines at about 1.3 times the font size and keeps the last line in the box', () => {
    const bounds = { x: 2, y: 2, width: 220, height: 80 };
    const long = Array.from({ length: 10 }, () => '• Students will develop a model of particle motion').join(
      '\n',
    );
    const size = fitPdfFieldFontSize(long, font, bounds, 'multiline');
    const lines = layoutPdfFieldText(long, font, size, bounds);
    const texts = runsOfKind(lines, 'text');
    expect(texts.length).toBeGreaterThan(1);
    expect(texts[0].y - texts[1].y).toBeCloseTo(size * PDF_LINE_HEIGHT_RATIO, 1);
    const minY = Math.min(...lines.map((line) => line.y));
    expect(minY).toBeGreaterThanOrEqual(bounds.y - 0.05);
  });
});
