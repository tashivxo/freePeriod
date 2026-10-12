import { render, screen, waitFor } from '@/tests/helpers';
import { LocaleProvider } from '@/providers/locale';
import type { LessonPlan } from '@/types';

const mockPush = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
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

jest.mock('@/features/lesson/components/SectionCard', () => ({
  SectionCard: ({
    title,
    isEditing,
    onEdit,
    onDone,
    onChange,
  }: {
    title: string;
    isEditing: boolean;
    onEdit: () => void;
    onDone: () => void;
    onChange: (html: string) => void;
  }) => (
    <div>
      <h3>{title}</h3>
      {isEditing ? (
        <>
          <textarea
            aria-label={`Section editor ${title}`}
            onChange={(event) => onChange(event.target.value)}
          />
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

describe('LessonView unsaved changes', () => {
  let confirmSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it('flushes unsaved edits on Back and leaves without a prompt', async () => {
    const { user } = render(
      <LocaleProvider initialLocale="en">
        <LessonView lesson={lesson} />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user.type(screen.getByLabelText('Section editor Hook Activity'), 'Unsaved hook');
    await user.click(screen.getByRole('button', { name: /back to dashboard/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
    expect(mockUpdate.mock.calls[0][0].content.hook).toContain('Unsaved hook');
  });

  it('flushes unsaved edits on in-app navigation and leaves without a prompt', async () => {
    const { user } = render(
      <LocaleProvider initialLocale="en">
        <div>
          <a href="/history">History</a>
          <LessonView lesson={lesson} />
        </div>
      </LocaleProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user.type(screen.getByLabelText('Section editor Hook Activity'), 'Nav hook');
    await user.click(screen.getByRole('link', { name: 'History' }));

    expect(confirmSpy).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/history');
    });
    expect(mockUpdate.mock.calls[0][0].content.hook).toContain('Nav hook');
  });

  it('asks Leave without saving your edits? only when the flush fails', async () => {
    mockEq.mockResolvedValue({ error: { message: 'db error' } });

    const { user } = render(
      <LocaleProvider initialLocale="en">
        <LessonView lesson={lesson} />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user.type(screen.getByLabelText('Section editor Hook Activity'), 'Unsaved hook');
    await user.click(screen.getByRole('button', { name: /back to dashboard/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
    expect(confirmSpy).toHaveBeenCalledWith('Leave without saving your edits?');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('leaves without saving after the teacher confirms a failed flush', async () => {
    mockEq.mockResolvedValue({ error: { message: 'db error' } });
    confirmSpy.mockReturnValue(true);

    const { user } = render(
      <LocaleProvider initialLocale="en">
        <LessonView lesson={lesson} />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user.type(screen.getByLabelText('Section editor Hook Activity'), 'Unsaved hook');
    await user.click(screen.getByRole('button', { name: /back to dashboard/i }));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith('Leave without saving your edits?');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('does not warn when leaving with no unsaved edits', async () => {
    const { user } = render(
      <LocaleProvider initialLocale="en">
        <LessonView lesson={lesson} />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole('button', { name: /back to dashboard/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('keeps the beforeunload warning when closing the tab with unsaved edits', async () => {
    const { user } = render(
      <LocaleProvider initialLocale="en">
        <LessonView lesson={lesson} />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user.type(screen.getByLabelText('Section editor Hook Activity'), 'Unsaved hook');

    const event = new Event('beforeunload', { cancelable: true });
    const prevented = !window.dispatchEvent(event);

    expect(event.defaultPrevented || prevented).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
