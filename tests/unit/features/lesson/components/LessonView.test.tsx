import { render, screen, waitFor } from '@/tests/helpers';
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

jest.mock('@/features/lesson/components/SectionCard', () => ({
  SectionCard: ({ title }: { title: string }) => <div>{title}</div>,
}));

const mockHandleFile = jest.fn();

jest.mock('@/hooks/useFileUpload', () => ({
  useFileUpload: jest.fn(() => ({
    file: null,
    storagePath: null,
    uploadId: null,
    isUploading: false,
    error: null,
    handleFile: mockHandleFile,
    removeFile: jest.fn(),
  })),
}));

jest.mock('@/lib/download-blob', () => ({
  downloadBlob: jest.fn(),
}));

import { useDebouncedLessonSave } from '@/hooks/useDebouncedLessonSave';
import { useFileUpload } from '@/hooks/useFileUpload';
import { downloadBlob } from '@/lib/download-blob';
import {
  BTN_DOWNLOAD_FREEPERIOD_TEMPLATE,
  BTN_USE_SHARED_TEMPLATE,
  FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE,
  FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE,
} from '@/features/lesson/components/filled-template-copy';
import { TEMPLATE_UNFILLED_ERROR } from '@/lib/export/fill-template-result';
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

describe('LessonView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useDebouncedLessonSave as jest.Mock).mockReturnValue({
      save: mockSave,
      status: 'idle',
      error: null,
    });
    (global.fetch as jest.Mock) = jest.fn();
  });

  it('shows formatted grade in the header', () => {
    render(<LessonView lesson={lesson} />);

    expect(screen.getByText('Science · Grade 9')).toBeInTheDocument();
  });

  it('shows save status text in the header', () => {
    (useDebouncedLessonSave as jest.Mock).mockReturnValue({
      save: mockSave,
      status: 'saved',
      error: null,
    });

    render(<LessonView lesson={lesson} />);

    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('shows the curriculum accuracy notice on generated lessons', () => {
    render(<LessonView lesson={lesson} />);

    expect(screen.getByRole('note', { name: /curriculum accuracy notice/i })).toHaveTextContent(
      /verify the plan against your official requirements/i,
    );
  });

  it('shows inline export error when download fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Export service unavailable' }),
    });

    const { user } = render(<LessonView lesson={lesson} />);
    await user.click(screen.getByRole('button', { name: /download docx/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Export service unavailable');
    });
  });

  it('gives the back link a minimum tap target height', () => {
    render(<LessonView lesson={lesson} />);

    expect(screen.getByRole('button', { name: /back to dashboard/i })).toHaveClass('min-h-11');
  });

  it('always shows Download filled template and opens no-template dialog copy', async () => {
    const { user } = render(<LessonView lesson={lesson} />);

    expect(screen.getByRole('button', { name: /download filled template/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download filled-in template/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /download filled template/i }));

    expect(screen.getByText(FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE)).toBeInTheDocument();
  });

  it('opens has-template dialog when lesson has a fillable template', async () => {
    const withTemplate = {
      ...lesson,
      template_path: 'user-1/template/plan.docx',
    };
    const { user } = render(<LessonView lesson={withTemplate} />);

    await user.click(screen.getByRole('button', { name: /download filled template/i }));

    expect(screen.getByText(FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE)).toBeInTheDocument();
  });

  it('flips to has-template dialog after upload attaches template_path', async () => {
    const React = await import('react');
    (useFileUpload as jest.Mock).mockImplementation(() => {
      const [storagePath, setStoragePath] = React.useState<string | null>(null);
      return {
        file: storagePath ? { name: 'plan.docx' } : null,
        storagePath,
        uploadId: storagePath ? 'upload-1' : null,
        isUploading: false,
        error: null,
        handleFile: jest.fn(async () => {
          setStoragePath('user-1/template/plan.docx');
        }),
        removeFile: jest.fn(),
      };
    });

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/lessons/') && url.includes('/template')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            lesson: { id: lesson.id, template_path: 'user-1/template/plan.docx' },
          }),
        });
      }
      return Promise.resolve({ ok: true, blob: async () => new Blob() });
    });

    const { user } = render(<LessonView lesson={lesson} />);
    await user.click(screen.getByRole('button', { name: /download filled template/i }));

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();

    const file = new File(['x'], 'plan.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    await user.upload(input as HTMLInputElement, file);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/lessons/${lesson.id}/template`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE)).toBeInTheDocument();
    });
  });

  it('keeps dialog open and shows error in dialog when FreePeriod export fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Export service unavailable' }),
    });

    const { user } = render(<LessonView lesson={lesson} />);
    await user.click(screen.getByRole('button', { name: /download filled template/i }));
    await user.click(screen.getByRole('button', { name: /download a freeperiod generated lesson plan/i }));

    await waitFor(() => {
      expect(screen.getByText(FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE)).toBeInTheDocument();
      expect(screen.getAllByRole('alert').some((alert) =>
        alert.textContent?.includes('Export service unavailable'),
      )).toBe(true);
    });
  });

  it('does not download an unfilled template and keeps the FreePeriod fallback available', async () => {
    const withTemplate = {
      ...lesson,
      template_path: 'user-1/template/plan.docx',
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: TEMPLATE_UNFILLED_ERROR, code: 'TEMPLATE_UNFILLED' }),
    });

    const { user } = render(<LessonView lesson={withTemplate} />);
    await user.click(screen.getByRole('button', { name: /download filled template/i }));
    await user.click(screen.getByRole('button', { name: BTN_USE_SHARED_TEMPLATE }));

    await waitFor(() => {
      expect(screen.getByText(TEMPLATE_UNFILLED_ERROR)).toBeInTheDocument();
    });
    expect(downloadBlob).not.toHaveBeenCalled();
    expect(screen.getByText(FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: BTN_DOWNLOAD_FREEPERIOD_TEMPLATE })).toBeInTheDocument();
  });

  it('downloads the filled blob when fill-template returns 200', async () => {
    const withTemplate = {
      ...lesson,
      template_path: 'user-1/template/plan.docx',
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(['filled-docx'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    });

    const { user } = render(<LessonView lesson={withTemplate} />);
    await user.click(screen.getByRole('button', { name: /download filled template/i }));
    await user.click(screen.getByRole('button', { name: BTN_USE_SHARED_TEMPLATE }));

    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledWith(
        expect.any(Blob),
        'Photosynthesis-filled.docx',
      );
    });
    expect(screen.queryByText(TEMPLATE_UNFILLED_ERROR)).not.toBeInTheDocument();
  });
});
