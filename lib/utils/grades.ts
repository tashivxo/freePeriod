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

function gradeLabel(g: string): string {
  return g;
}

/** Dropdown items for grade selectors — human-readable labels, raw values. */
export const GRADE_ITEMS: DropdownItem[] = (GRADES as readonly string[]).map((g) => ({
  name: gradeLabel(g),
  value: g,
}));
