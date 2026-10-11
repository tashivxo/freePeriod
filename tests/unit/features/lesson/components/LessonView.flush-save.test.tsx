import { render, screen, waitFor } from '@/tests/helpers';
import { LocaleProvider } from '@/providers/locale';
import type { LessonPlan } from '@/types';
import { BTN_FILL_TEMPLATE, FILL_MY_TEMPLATE_LABEL } from '@/features/lesson/components/filled-template-copy';
import { FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL } from '@/lib/export/copy';

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
    onBlur,
    isEdited,
    editedLabel,
  }: {
    title: string;
    isEditing: boolean;
    onEdit: () => void;
    onDone: () => void;
    onChange: (html: string) => void;
    onBlur?: () => void;
    isEdited?: boolean;
    editedLabel?: string;
  }) => (
    <div>
      <h3>{title}</h3>
      {isEdited ? <span>{editedLabel ?? 'Edited'}</span> : null}
      {isEditing ? (
        <>
          <textarea
            aria-label={`Section editor ${title}`}
            onChange={(event) => onChange(event.target.value)}
            onBlur={() => onBlur?.()}
          />
          <button type="button" onClick={onDone}>
            Done editing {title}
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

function renderLesson(viewLesson: LessonPlan = lesson) {
  return render(
    <LocaleProvider initialLocale="en">
      <LessonView lesson={viewLesson} />
    </LocaleProvider>,
  );
}

describe('LessonView flush save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['docx']),
    });
  });

  it('includes edited text in an export started right after Done', async () => {
    let saved = false;
    mockEq.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
      saved = true;
      return { error: null };
    });
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url === '/api/export') {
        expect(saved).toBe(true);
      }
      return { ok: true, blob: async () => new Blob(['docx']) };
    });

    const { user } = renderLesson();
    const edited = 'Teacher edited hook for export';

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user.type(screen.getByLabelText('Section editor Hook Activity'), edited);
    await user.click(screen.getByRole('button', { name: 'Done editing Hook Activity' }));
    await user.click(screen.getByRole('button', { name: FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/export',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ lessonId: lesson.id, format: 'docx' }),
        }),
      );
    });

    expect(mockUpdate.mock.calls[0][0].content.hook).toContain(edited);
    expect(JSON.stringify(mockUpdate.mock.calls[0][0])).not.toMatch(/originalContent|original_content/i);
  });

  it('awaits a flush before a Fill my template request starts', async () => {
    let saved = false;
    mockEq.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
      saved = true;
      return { error: null };
    });
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (typeof url === 'string' && url.includes('/api/export/fill-template')) {
        expect(saved).toBe(true);
      }
      return { ok: true, blob: async () => new Blob(['filled']) };
    });

    const { user } = renderLesson({
      ...lesson,
      template_path: 'user-1/template/plan.docx',
    });
    const edited = 'Filled template uses this hook';

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user.type(screen.getByLabelText('Section editor Hook Activity'), edited);
    await user.click(screen.getByRole('button', { name: FILL_MY_TEMPLATE_LABEL }));
    await user.click(screen.getByRole('button', { name: BTN_FILL_TEMPLATE }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/export/fill-template',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    expect(mockUpdate.mock.calls[0][0].content.hook).toContain(edited);
  });

  it('flushes the pending save when Done is clicked', async () => {
    const { user } = renderLesson();

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user.type(screen.getByLabelText('Section editor Hook Activity'), 'Saved on Done');
    await user.click(screen.getByRole('button', { name: 'Done editing Hook Activity' }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
    expect(mockUpdate.mock.calls[0][0].content.hook).toContain('Saved on Done');
  });

  it('flushes the pending save when the editor blurs', async () => {
    const { user } = renderLesson();

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user.type(screen.getByLabelText('Section editor Hook Activity'), 'Saved on blur');
    await user.tab();

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
    expect(mockUpdate.mock.calls[0][0].content.hook).toContain('Saved on blur');
  });

  it('shows a saved toast that downloads use the edits', async () => {
    const { user } = renderLesson();

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user.type(screen.getByLabelText('Section editor Hook Activity'), 'Toast after save');
    await user.click(screen.getByRole('button', { name: 'Done editing Hook Activity' }));

    expect(await screen.findByText('Saved. Downloads use your edits.')).toBeInTheDocument();
  });

  it('shows an Edited tag on a section after a saved edit', async () => {
    const { user } = renderLesson();

    await user.click(screen.getByRole('button', { name: 'Edit Hook Activity' }));
    await user.type(screen.getByLabelText('Section editor Hook Activity'), 'Marked as edited');
    await user.click(screen.getByRole('button', { name: 'Done editing Hook Activity' }));

    expect(await screen.findByText('Edited')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restore/i })).not.toBeInTheDocument();
  });

  it('shows an Edited tag for sections already saved as edited, without Restore', () => {
    renderLesson({
      ...lesson,
      content: {
        ...lesson.content,
        editedKeys: ['hook'],
      } as LessonPlan['content'],
    });

    expect(screen.getByText('Edited')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restore/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/restore original/i)).not.toBeInTheDocument();
  });
});
