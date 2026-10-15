/**
 * @jest-environment node
 */
import {
  containsArabic,
  normalizePdfPunctuation,
  paragraphBaseIsRtl,
  shapePdfText,
  usesArabicPresentationForms,
} from '@/lib/export/pdf-text';

describe('shapePdfText', () => {
  it('leaves English-only text unchanged', () => {
    const text = 'Exploring States of Matter';
    expect(shapePdfText(text)).toBe(text);
    expect(containsArabic(text)).toBe(false);
    expect(paragraphBaseIsRtl(text)).toBe(false);
  });

  it('shapes an Arabic-only line into presentation forms and RTL visual order', () => {
    const logical = 'التمثيل الضوئي';
    const visual = shapePdfText(logical);
    expect(visual).not.toBe(logical);
    expect(usesArabicPresentationForms(visual)).toBe(true);
    expect(paragraphBaseIsRtl(logical)).toBe(true);
  });

  it('keeps mixed Arabic and English on the same line', () => {
    const logical = 'Lesson التمثيل الضوئي Grade 8';
    const visual = shapePdfText(logical);
    expect(visual.startsWith('Lesson')).toBe(true);
    expect(visual).toContain('Grade 8');
    expect(usesArabicPresentationForms(visual)).toBe(true);
    expect(visual).not.toContain('التمثيل');
    expect(paragraphBaseIsRtl(logical)).toBe(false);
  });
});

describe('normalizePdfPunctuation', () => {
  it('maps dashes and quotes without stripping letters or bullets', () => {
    expect(normalizePdfPunctuation('• Hello')).toBe('• Hello');
    expect(normalizePdfPunctuation('التمثيل')).toBe('التمثيل');
  });

  it('replaces a leading hyphen list marker with U+2022 so lists are not "- - "', () => {
    expect(normalizePdfPunctuation('- Students will learn')).toBe('• Students will learn');
    expect(normalizePdfPunctuation('- Students\n- Next')).toBe('• Students\n• Next');
  });

  it('replaces a leading "* " list marker with U+2022 so lists are not "• * "', () => {
    expect(normalizePdfPunctuation('* Students will learn')).toBe('• Students will learn');
    expect(normalizePdfPunctuation('* Students\n* Next')).toBe('• Students\n• Next');
  });

  it('strips leftover "- " or "* " after an existing bullet so lists are not "• - " or "• * "', () => {
    expect(normalizePdfPunctuation('• - Students will learn')).toBe('• Students will learn');
    expect(normalizePdfPunctuation('• - One\n• - Two')).toBe('• One\n• Two');
    expect(normalizePdfPunctuation('• * Students will learn')).toBe('• Students will learn');
  });
});
