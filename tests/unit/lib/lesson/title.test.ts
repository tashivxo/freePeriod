import { LESSON_TITLE_MAX_LENGTH, parseLessonTitle } from '@/lib/lesson/title';

describe('parseLessonTitle', () => {
  it('returns trimmed title', () => {
    expect(parseLessonTitle('  Fractions  ')).toEqual({ ok: true, title: 'Fractions' });
  });

  it('accepts Arabic text', () => {
    expect(parseLessonTitle('  الكسور  ')).toEqual({ ok: true, title: 'الكسور' });
  });

  it('rejects blank and whitespace-only titles', () => {
    expect(parseLessonTitle('')).toEqual({ ok: false, reason: 'missing' });
    expect(parseLessonTitle('   ')).toEqual({ ok: false, reason: 'missing' });
  });

  it('rejects non-string values', () => {
    expect(parseLessonTitle(42)).toEqual({ ok: false, reason: 'invalid' });
    expect(parseLessonTitle(null)).toEqual({ ok: false, reason: 'missing' });
  });

  it('truncates titles longer than the max length', () => {
    const long = 'a'.repeat(LESSON_TITLE_MAX_LENGTH + 50);
    const parsed = parseLessonTitle(long);
    expect(parsed).toEqual({ ok: true, title: 'a'.repeat(LESSON_TITLE_MAX_LENGTH) });
  });
});