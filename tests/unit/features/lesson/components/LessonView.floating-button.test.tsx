import { render, screen } from '@/tests/helpers';
import type { LessonPlan } from '@/types';
import { ThemeProvider } from '@/providers/theme';
import { LessonEditingProvider } from '@/providers/lesson-editing';
import { AppFloatingButton } from '@/components/layout/AppFloatingButton';

const mockPush = jest.fn();
const mockSave = jest.fn();
const mockFlush = jest.fn(async () => true);
const mockCancel = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/lesson/lesson-1',
}));

jest.mock('@/hooks/useDebouncedLessonSave', () => ({
  useDebouncedLessonSave: jest.fn(() => ({
    save: mockSave,
    flush: mockFlush,
    cancel: mockCancel,
    revert: jest.fn(),
    status: 'idle',
    error: null,
    isDirty: false,
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

jest.mock('@/features/lesson/components/SectionCard', () => ({
  SectionCard: ({
    title,
    isEditing,
    onEdit,
  }: {
    title: string;
    isEditing: boolean;
    onEdit: () => void;
  }) => (
    <div>
      <span>{title}</span>
      {isEditing ? (
        <button type="button">Save</button>
      ) : (
        <button type="button" onClick={onEdit}>
          Edit {title}
        </button>
      )}
    </div>
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

const lesson: LessonPlan = {
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

function renderLessonChrome() {
  return render(
    <ThemeProvider>
      <LessonEditingProvider>
        <AppFloatingButton />
        <LessonView lesson={lesson} />
      </LessonEditingProvider>
    </ThemeProvider>,
  );
}

describe('LessonView floating button', () => {
  beforeEach(() => {
    mockFlush.mockResolvedValue(true);
  });

  it('is not rendered or visible while any section is being edited', async () => {
    const { user } = renderLessonChrome();

    const fab = screen.getByTestId('app-floating-button');
    expect(fab).toBeVisible();
    expect(fab).toHaveClass('fixed', 'bottom-6', 'end-4');

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.queryByTestId('app-floating-button')).not.toBeInTheDocument();
  });
});
