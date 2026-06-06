import type { LessonSectionKey } from '@/types';

export type LessonSectionDef = {
  key: LessonSectionKey;
  /** Card heading in lesson view */
  label: string;
  /** Label shown during generation progress */
  progressLabel: string;
  /** Heading in DOCX/PDF exports */
  exportHeading: string;
  /** Render as an editable section card (title is shown in the page header) */
  showInView: boolean;
};

export const LESSON_SECTIONS: readonly LessonSectionDef[] = [
  { key: 'title', label: 'Title', progressLabel: 'Title', exportHeading: 'Title', showInView: false },
  {
    key: 'essentialQuestion',
    label: 'Essential Question',
    progressLabel: 'Essential question',
    exportHeading: 'Essential Question',
    showInView: true,
  },
  {
    key: 'objectives',
    label: 'Learning Objectives',
    progressLabel: 'Learning objectives',
    exportHeading: 'Learning Objectives',
    showInView: true,
  },
  {
    key: 'successCriteria',
    label: 'Success Criteria',
    progressLabel: 'Success criteria',
    exportHeading: 'Success Criteria',
    showInView: true,
  },
  {
    key: 'keyConcepts',
    label: 'Key Concepts',
    progressLabel: 'Key concepts',
    exportHeading: 'Key Concepts',
    showInView: true,
  },
  {
    key: 'vocabulary',
    label: 'New Vocabulary',
    progressLabel: 'New vocabulary',
    exportHeading: 'New Vocabulary',
    showInView: true,
  },
  {
    key: 'hook',
    label: 'Hook Activity',
    progressLabel: 'Hook activity',
    exportHeading: 'Hook Activity',
    showInView: true,
  },
  {
    key: 'mainActivities',
    label: 'Main Activities',
    progressLabel: 'Main activities',
    exportHeading: 'Main Activities',
    showInView: true,
  },
  {
    key: 'guidedPractice',
    label: 'Guided Practice',
    progressLabel: 'Guided practice',
    exportHeading: 'Guided Practice',
    showInView: true,
  },
  {
    key: 'independentPractice',
    label: 'Independent Practice',
    progressLabel: 'Independent practice',
    exportHeading: 'Independent Practice',
    showInView: true,
  },
  {
    key: 'formativeAssessment',
    label: 'Formative Assessment',
    progressLabel: 'Formative assessment',
    exportHeading: 'Formative Assessment',
    showInView: true,
  },
  {
    key: 'differentiation',
    label: 'Differentiation',
    progressLabel: 'Differentiation strategies',
    exportHeading: 'Differentiation',
    showInView: true,
  },
  {
    key: 'realWorldConnections',
    label: 'Real-World Connections',
    progressLabel: 'Real-world connections',
    exportHeading: 'Real-World Connections',
    showInView: true,
  },
  {
    key: 'plenary',
    label: 'Plenary',
    progressLabel: 'Plenary',
    exportHeading: 'Plenary',
    showInView: true,
  },
] as const;

export const LESSON_SECTION_KEYS: readonly LessonSectionKey[] = LESSON_SECTIONS.map((section) => section.key);

export const LESSON_SECTION_COUNT = LESSON_SECTIONS.length;

export const LESSON_VIEW_SECTIONS = LESSON_SECTIONS.filter((section) => section.showInView);

export function getSectionProgressLabel(key: LessonSectionKey): string {
  return LESSON_SECTIONS.find((section) => section.key === key)?.progressLabel ?? key;
}
