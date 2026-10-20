import { createT } from '@/lib/i18n/format';
import { formatGradeLabel } from '@/lib/utils/grades';
import { FSI, PDI } from '@/tests/helpers/bidi';

const t = createT('en');

describe('formatGradeLabel', () => {
  it('formats numeric grades', () => {
    expect(formatGradeLabel('5', t)).toBe(`Grade ${FSI}5${PDI}`);
    expect(formatGradeLabel('9', t)).toBe(`Grade ${FSI}9${PDI}`);
    expect(formatGradeLabel('12', t)).toBe(`Grade ${FSI}12${PDI}`);
  });

  it('formats UK year groups', () => {
    expect(formatGradeLabel('Year 5', t)).toBe(`Year ${FSI}5${PDI}`);
    expect(formatGradeLabel('Year 7', t)).toBe(`Year ${FSI}7${PDI}`);
    expect(formatGradeLabel('Year 13', t)).toBe(`Year ${FSI}13${PDI}`);
  });

  it('formats K and Pre-K', () => {
    expect(formatGradeLabel('K', t)).toBe('Kindergarten');
    expect(formatGradeLabel('Pre-K', t)).toBe('Pre-K');
  });

  it('formats already-prefixed Grade labels', () => {
    expect(formatGradeLabel('Grade 5', t)).toBe(`Grade ${FSI}5${PDI}`);
    expect(formatGradeLabel('Grade 9', t)).toBe(`Grade ${FSI}9${PDI}`);
  });

  it('handles empty and whitespace input', () => {
    expect(formatGradeLabel('', t)).toBe('');
    expect(formatGradeLabel('   ', t)).toBe('');
    expect(formatGradeLabel(' 5 ', t)).toBe(`Grade ${FSI}5${PDI}`);
  });

  it('localizes numbered, year, and kindergarten labels when a translator is provided', () => {
    const ar = (key: string, vars?: Record<string, string>) => {
      if (key === 'grades.numbered') return `الصف ${vars?.n}`;
      if (key === 'grades.year') return `السنة ${vars?.n}`;
      if (key === 'grades.kindergarten') return 'رياض الأطفال';
      if (key === 'grades.preK') return 'ما قبل الروضة';
      return key;
    };

    expect(formatGradeLabel('8', ar)).toBe(`الصف ${FSI}8${PDI}`);
    expect(formatGradeLabel('Grade 8', ar)).toBe(`الصف ${FSI}8${PDI}`);
    expect(formatGradeLabel('4', ar)).toBe(`الصف ${FSI}4${PDI}`);
    expect(formatGradeLabel('Year 7', ar)).toBe(`السنة ${FSI}7${PDI}`);
    expect(formatGradeLabel('K', ar)).toBe('رياض الأطفال');
    expect(formatGradeLabel('Pre-K', ar)).toBe('ما قبل الروضة');
  });
});
