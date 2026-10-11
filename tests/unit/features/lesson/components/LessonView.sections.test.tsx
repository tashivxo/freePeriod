import { render, screen, within } from '@/tests/helpers';
import type { LessonPlan } from '@/types';

const mockPush = jest.fn();
const mockSave = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/hooks/useDebouncedLessonSave', () => ({
  useDebouncedLessonSave: jest.fn(() => ({
    save: mockSave,
    status: 'idle',
    error: null,
  })),
}));

jest.mock('@/providers/zen-mode', () => ({
  useZenMode: () => ({ zenMode: true }),
}));

jest.mock('animejs', () => ({
  animate: jest.fn(),
  stagger: jest.fn(),
  remove: jest.fn(),
}));

jest.mock('@/components/ui/effects/BlurText', () => ({
  BlurText: ({ text, className }: { text: string; className?: string }) => (
    <h1 className={className}>{text}</h1>
  ),
}));

jest.mock('@/hooks/useFileUpload', () => ({
  useFileUpload: jest.fn(() => ({
    file: null,
    storagePath: null,
    uploadId: null,
    isUploading: false,
    error: null,
    handleFile: jest.fn(),
    removeFile: jest.fn(),
  })),
}));

jest.mock('@/lib/download-blob', () => ({
  downloadBlob: jest.fn(),
}));

import { LessonView } from '@/features/lesson/components/LessonView';

const EMPTY_DIFFERENTIATION_MESSAGE = 'No differentiation suggestions for this lesson.';

const baseLesson: LessonPlan = {
  id: 'lesson-1',
  user_id: 'user-1',
  title: 'Photosynthesis',
  subject: 'Science',
  grade: '9',
  curriculum: 'CAPS',
  duration_minutes: 60,
  content: {
    title: 'Photosynthesis',
    objectives: ['Understand light reactions'],
    successCriteria: ['Label a chloroplast'],
    keyConcepts: ['Energy transfer'],
    hook: 'Leaf observation',
    mainActivities: ['Lab'],
    guidedPractice: ['Worksheet'],
    independentPractice: ['Exit ticket'],
    formativeAssessment: ['Quiz'],
    differentiation: { support: ['Visual aids'], extension: ['Research'] },
    realWorldConnections: ['Agriculture'],
    plenary: 'Summary discussion',
  },
  model_used: 'gemini',
  token_count: 100,
  template_path: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function lessonWithDifferentiation(
  differentiation: LessonPlan['content']['differentiation'],
): LessonPlan {
  return {
    ...baseLesson,
    content: { ...baseLesson.content, differentiation },
  };
}

function sectionCard(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: title, level: 3 });
  const card = heading.closest('.rounded-xl');
  if (!(card instanceof HTMLElement)) {
    throw new Error(`Section card not found for "${title}"`);
  }
  return card;
}

function expectNoRawJson(container: HTMLElement) {
  expect(container.textContent).not.toMatch(/"support"\s*:/);
  expect(container.textContent).not.toMatch(/"extension"\s*:/);
  expect(container.innerHTML).not.toContain('{ "support": []');
  expect(container.innerHTML).not.toContain('"support": []');
  expect(container.innerHTML).not.toContain('"extension": []');
}

describe('LessonView section empty lists', () => {
  it('does not render raw JSON when support and extension lists are empty', () => {
    render(
      <LessonView
        lesson={lessonWithDifferentiation({ support: [], extension: [] })}
      />,
    );

    const card = sectionCard('Differentiation');
    expectNoRawJson(card);
    expect(within(card).queryByRole('heading', { name: 'Support' })).not.toBeInTheDocument();
    expect(within(card).queryByRole('heading', { name: 'Extension' })).not.toBeInTheDocument();
  });

  it('hides the empty Extension sub-part when only support has items', () => {
    render(
      <LessonView
        lesson={lessonWithDifferentiation({
          support: ['Sentence starters and a word bank'],
          extension: [],
        })}
      />,
    );

    const card = sectionCard('Differentiation');
    expect(within(card).getByText('Sentence starters and a word bank')).toBeInTheDocument();
    expect(within(card).getByRole('heading', { name: 'Support' })).toBeInTheDocument();
    expect(within(card).queryByRole('heading', { name: 'Extension' })).not.toBeInTheDocument();
    expect(within(card).queryByText(EMPTY_DIFFERENTIATION_MESSAGE)).not.toBeInTheDocument();
    expectNoRawJson(card);
  });

  it('hides the empty Support sub-part when only extension has items', () => {
    render(
      <LessonView
        lesson={lessonWithDifferentiation({
          support: [],
          extension: ['Independent research on local case studies'],
        })}
      />,
    );

    const card = sectionCard('Differentiation');
    expect(
      within(card).getByText('Independent research on local case studies'),
    ).toBeInTheDocument();
    expect(within(card).getByRole('heading', { name: 'Extension' })).toBeInTheDocument();
    expect(within(card).queryByRole('heading', { name: 'Support' })).not.toBeInTheDocument();
    expect(within(card).queryByText(EMPTY_DIFFERENTIATION_MESSAGE)).not.toBeInTheDocument();
    expectNoRawJson(card);
  });

  it('shows a muted empty state and keeps the edit control when the whole section is empty', () => {
    render(
      <LessonView
        lesson={lessonWithDifferentiation({ support: [], extension: [] })}
      />,
    );

    const card = sectionCard('Differentiation');
    const emptyState = within(card).getByText(EMPTY_DIFFERENTIATION_MESSAGE);
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveClass('text-text-secondary');
    expect(emptyState.textContent).not.toContain('\u2014');
    expect(within(card).getByRole('button', { name: 'Edit Differentiation' })).toBeInTheDocument();
    expect(within(card).queryByRole('heading', { name: 'Support' })).not.toBeInTheDocument();
    expect(within(card).queryByRole('heading', { name: 'Extension' })).not.toBeInTheDocument();
    expectNoRawJson(card);
  });
});
