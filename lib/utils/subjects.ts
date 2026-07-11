import type { DropdownItem } from '@/components/ui/animated-dropdown';

/**
 * Canonical list of supported subjects.
 * This is the single source of truth — shared across GenerateForm, Onboarding, and Settings.
 */
export const SUBJECTS = [
  'Mathematics',
  'English',
  'Science',
  'History',
  'Geography',
  'Biology',
  'Chemistry',
  'Physics',
  'Art',
  'Music',
  'Physical Education',
  'Computer Science',
  'Foreign Language',
  'Social Studies',
  'Economics',
  'Religious Education',
  'Design & Technology',
  'Drama',
] as const;

export type Subject = (typeof SUBJECTS)[number];

/** Dropdown items for subject selectors — includes "Custom" at the end. */
export const SUBJECT_ITEMS: DropdownItem[] = [
  ...(SUBJECTS as readonly string[]).map((s) => ({ name: s, value: s })),
  { name: 'Custom', value: 'Custom' },
];
