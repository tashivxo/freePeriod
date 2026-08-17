import { formatGradeLabel } from '@/lib/utils/grades';

describe('formatGradeLabel', () => {
  it('formats numeric grades', () => {
    expect(formatGradeLabel('5')).toBe('Grade 5');
    expect(formatGradeLabel('9')).toBe('Grade 9');
    expect(formatGradeLabel('12')).toBe('Grade 12');
  });

  it('keeps UK year groups as-is', () => {
    expect(formatGradeLabel('Year 5')).toBe('Year 5');
    expect(formatGradeLabel('Year 7')).toBe('Year 7');
    expect(formatGradeLabel('Year 13')).toBe('Year 13');
  });

  it('formats K and Pre-K', () => {
    expect(formatGradeLabel('K')).toBe('Kindergarten');
    expect(formatGradeLabel('Pre-K')).toBe('Pre-K');
  });

  it('leaves already-prefixed Grade labels unchanged', () => {
    expect(formatGradeLabel('Grade 5')).toBe('Grade 5');
    expect(formatGradeLabel('Grade 9')).toBe('Grade 9');
  });

  it('handles empty and whitespace input', () => {
    expect(formatGradeLabel('')).toBe('');
    expect(formatGradeLabel('   ')).toBe('');
    expect(formatGradeLabel(' 5 ')).toBe('Grade 5');
  });
});
