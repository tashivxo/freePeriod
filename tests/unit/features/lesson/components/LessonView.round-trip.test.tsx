import { render, screen, waitFor } from '@/tests/helpers';
import { LocaleProvider } from '@/providers/locale';
import type { LessonPlan, LessonSection } from '@/types';

const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
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

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: mockUpdate,
    })),
  })),
}));

const STRUCTURED_HTML =
  '<p>Para one</p><p>Para two</p><ul><li><p>Item A</p></li><li><p>Item B</p></li></ul>';
const STRUCTURED_TEXT = 'Para one\n\nPara two\n- Item A\n- Item B';

jest.mock('@/features/lesson/components/SectionCard', () => ({
  SectionCard: ({
    title,
    content,
    isEditing,
    onEdit,
    onDone,
    onChange,
  }: {
    title: string;
    content: string;
    isEditing: boolean;
    onEdit: () => void;
    onDone: () => void | boolean | Promise<boolean>;
    onChange: (html: string) => void;
  }) => (
    <div>
      <h3>{title}</h3>
      <pre data-testid={`section-content-${title}`}>{content}</pre>
      {isEditing ? (
        <>
          <button type="button" onClick={() => onChange(STRUCTURED_HTML)}>
            Apply structured HTML {title}
          </button>
          <button
            type="button"
            onClick={() => onChange(STRUCTURED_HTML)}
          >
            No-op editor HTML {title}
          </button>
          <button type="button" onClick={() => void onDone()}>
            Save
          </button>
        </>
      ) : (
        <button type="button" onClick={onEdit}>
          Edit {title}
        </button>
      )}
    </div>
  ),
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

function renderLesson(viewLesson: LessonPlan) {
  return render(
    <LocaleProvider initialLocale="en">
      <LessonView lesson={viewLesson} />
    </LocaleProvider>,
  );
}

describe('LessonView edit round-trip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
  });

  it('saves two paragraphs and a list then reopens the same text', async () => {
    const { user } = renderLesson(lesson);

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user.click(screen.getByRole('button', { name: 'Apply structured HTML Hook Activity' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });

    const saved = mockUpdate.mock.calls[0][0].content as LessonSection;
    expect(saved.hook).toBe(STRUCTURED_TEXT);
    expect(saved.hook).not.toBe('Para onePara twoItem AItem B');
    expect(JSON.stringify(mockUpdate.mock.calls[0][0])).not.toMatch(/original_content/);

    const { user: user2 } = renderLesson({ ...lesson, content: saved });
    expect(screen.getByTestId('section-content-Hook Activity').textContent).not.toBe(
      'Para onePara twoItem AItem B',
    );

    await user2.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user2.click(screen.getByRole('button', { name: 'Apply structured HTML Hook Activity' }));
    await user2.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    expect(mockUpdate.mock.calls[1][0].content.hook).toBe(STRUCTURED_TEXT);
    expect(mockUpdate.mock.calls[1][0].content.hook).toBe(saved.hook);
  });

  it('keeps structured content identical when saving a no-op editor HTML pass', async () => {
    const structuredLesson: LessonPlan = {
      ...lesson,
      content: { ...lesson.content, hook: STRUCTURED_TEXT },
    };
    const { user } = renderLesson(structuredLesson);

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user.click(screen.getByRole('button', { name: 'No-op editor HTML Hook Activity' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });

    expect(mockUpdate.mock.calls[0][0].content.hook).toBe(STRUCTURED_TEXT);
  });
});
