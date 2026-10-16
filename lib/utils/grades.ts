import type { DropdownItem } from '@/components/ui/animated-dropdown';

/**
 * Raw grade values stored in the database.
 * "K" = Kindergarten, "Pre-K" = Pre-Kindergarten, numbers 1–12 = Grade N, "Year N" = UK year groups.
 */
export const GRADES = [
  'Pre-K',
  'K',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Year 7',
  'Year 8',
  'Year 9',
  'Year 10',
  'Year 11',
  'Year 12',
  'Year 13',
] as const;

export type Grade = (typeof GRADES)[number];

type TranslateFn = (key: string, vars?: Record<string, string>) => string;

/** Human-readable label for a stored grade value (display only). */
export function formatGradeLabel(g: string, t?: TranslateFn): string {
  const trimmed = g.trim();
  if (!trimmed) return '';
  if (trimmed === 'Pre-K') return t ? t('grades.preK') : 'Pre-K';
  if (trimmed === 'K') return t ? t('grades.kindergarten') : 'Kindergarten';
  const yearMatch = trimmed.match(/^Year (\d+)$/);
  if (yearMatch) {
    return t ? t('grades.year', { n: yearMatch[1]! }) : trimmed;
  }
  const gradeMatch = trimmed.match(/^Grade\s+(.+)$/);
  if (gradeMatch) {
    return t ? t('grades.numbered', { n: gradeMatch[1]! }) : trimmed;
  }
  return t ? t('grades.numbered', { n: trimmed }) : `Grade ${trimmed}`;
}

/** Dropdown items for grade selectors — human-readable labels, raw values. */
export const GRADE_ITEMS: DropdownItem[] = (GRADES as readonly string[]).map((g) => ({
  name: formatGradeLabel(g),
  value: g,
}));
