import type { DropdownItem } from '@/components/ui/animated-dropdown';

/**
 * Canonical list of supported curricula.
 * This is the single source of truth — shared across GenerateForm, Onboarding, and Settings.
 */
export const CURRICULA = [
  'IB',
  'AP',
  'Common Core',
  'GCSE',
  'A-Level',
  'Cambridge IGCSE',
  'National Curriculum (England)',
  'Australian Curriculum',
  'CBSE (India)',
  'CAPS (South Africa)',
  'UAE MOE',
  'Edexcel',
  'AQA',
  'OCR',
] as const;

export type Curriculum = (typeof CURRICULA)[number];

/** Dropdown items for curriculum selectors — includes "Custom" at the end. */
export const CURRICULUM_ITEMS: DropdownItem[] = [
  ...(CURRICULA as readonly string[]).map((c) => ({ name: c, value: c })),
  { name: 'Custom', value: 'Custom' },
];
