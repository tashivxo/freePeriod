import { formatGradeLabel } from '@/lib/utils/grades';

const FSI = '\u2068';
const PDI = '\u2069';

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

  it('localizes numbered, year, and kindergarten labels when a translator is provided', () => {
    const t = (key: string, vars?: Record<string, string>) => {
      if (key === 'grades.numbered') return `الصف ${vars?.n}`;
      if (key === 'grades.year') return `السنة ${vars?.n}`;
      if (key === 'grades.kindergarten') return 'رياض الأطفال';
      if (key === 'grades.preK') return 'ما قبل الروضة';
      return key;
    };

    expect(formatGradeLabel('8', t)).toBe(`الصف ${FSI}8${PDI}`);
    expect(formatGradeLabel('Grade 8', t)).toBe(`الصف ${FSI}8${PDI}`);
    expect(formatGradeLabel('4', t)).toBe(`الصف ${FSI}4${PDI}`);
    expect(formatGradeLabel('Year 7', t)).toBe(`السنة ${FSI}7${PDI}`);
    expect(formatGradeLabel('K', t)).toBe('رياض الأطفال');
    expect(formatGradeLabel('Pre-K', t)).toBe('ما قبل الروضة');
  });
});
