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
  BTN_FILL_TEMPLATE,
  BTN_UPLOAD_ONE_NOW,
  FILL_MY_TEMPLATE_LABEL,
  FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE,
  FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE,
} from '@/features/lesson/components/filled-template-copy';
import { FILLED_TEMPLATE_DOWNLOAD_MESSAGE } from '@/lib/export/export-error';
import { FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL } from '@/lib/export/copy';
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

  it('shows the Free Period template export label on the toolbar download button', () => {
    render(<LessonView lesson={lesson} />);

    const downloadButton = screen.getByRole('button', { name: 'Free Period template' });
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).toHaveAccessibleName('Free Period template');
    expect(
      screen.getByRole('button', { name: 'Fill my template' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Download lesson plan (FreePeriod template)' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Download DOCX' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Download DOCX')).not.toBeInTheDocument();
  });

  it('shows inline export error when download fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Export service unavailable' }),
    });

    const { user } = render(<LessonView lesson={lesson} />);
    await user.click(
      screen.getByRole('button', { name: 'Free Period template' }),
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, format: 'docx' }),
      });
      expect(screen.getByRole('alert')).toHaveTextContent('Export service unavailable');
    });
  });

  it('gives the back link a minimum tap target height', () => {
    render(<LessonView lesson={lesson} />);

    expect(screen.getByRole('button', { name: /back to dashboard/i })).toHaveClass('min-h-11');
  });

  it('makes Download the solid yellow action and Fill the soft coral action when no template is uploaded', async () => {
    const { user } = render(<LessonView lesson={lesson} />);

    const fillButton = screen.getByRole('button', { name: FILL_MY_TEMPLATE_LABEL });
    const downloadButton = screen.getByRole('button', { name: FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL });

    expect(downloadButton).toHaveAttribute('data-variant', 'accent');
    expect(fillButton).toHaveAttribute('data-variant', 'soft');
    expect(screen.queryByText('Uses your uploaded template')).not.toBeInTheDocument();

    await user.click(fillButton);
    expect(screen.getByText(FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: BTN_UPLOAD_ONE_NOW })).toBeInTheDocument();
  });

  it('makes Fill the solid coral action with a helper line when a template is uploaded', () => {
    render(
      <LessonView
        lesson={{ ...lesson, template_path: 'user-1/template/plan.docx' }}
      />,
    );

    const fillButton = screen.getByRole('button', { name: FILL_MY_TEMPLATE_LABEL });
    const downloadButton = screen.getByRole('button', { name: FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL });
    const helper = screen.getByText('Uses your uploaded template');

    expect(fillButton).toHaveAttribute('data-variant', 'default');
    expect(downloadButton).toHaveAttribute('data-variant', 'secondary');
    expect(fillButton).not.toContainElement(helper);
    expect(fillButton.compareDocumentPosition(helper) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('always shows an enabled Fill my template button and opens no-template copy', async () => {
    const { user } = render(<LessonView lesson={lesson} />);

    const fillButton = screen.getByRole('button', { name: FILL_MY_TEMPLATE_LABEL });
    expect(fillButton).toBeEnabled();

    await user.click(fillButton);

    expect(screen.getByText(FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: BTN_UPLOAD_ONE_NOW })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: BTN_FILL_TEMPLATE })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
  });

  it('opens has-template dialog when lesson has a fillable template', async () => {
    const withTemplate = {
      ...lesson,
      template_path: 'user-1/template/plan.docx',
    };
    const { user } = render(<LessonView lesson={withTemplate} />);

    await user.click(screen.getByRole('button', { name: FILL_MY_TEMPLATE_LABEL }));

    expect(screen.getByText(FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: BTN_FILL_TEMPLATE })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: BTN_UPLOAD_ONE_NOW })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: FILL_MY_TEMPLATE_LABEL }));

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

  it('does not download an unfilled template and keeps the shared dialog open', async () => {
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
    await user.click(screen.getByRole('button', { name: FILL_MY_TEMPLATE_LABEL }));
    await user.click(screen.getByRole('button', { name: BTN_FILL_TEMPLATE }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(TEMPLATE_UNFILLED_ERROR);
      expect(alert).toHaveClass('bg-error/10', 'text-error');
      expect(alert.querySelector('svg')).toBeInTheDocument();
    });
    expect(screen.queryByText(/TypeError|at fillTemplate/)).not.toBeInTheDocument();
    expect(downloadBlob).not.toHaveBeenCalled();
    expect(screen.getByText(FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
  });

  it('uses the shared animated alert and teacher-friendly copy for a 500', async () => {
    const withTemplate = {
      ...lesson,
      template_path: 'user-1/template/plan.docx',
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error:
          'TypeError: Cannot convert argument to a ByteString because the character at index 69 has a value of 8212',
        code: 'CONTENT_DISPOSITION_FAILED',
      }),
    });

    const { user } = render(<LessonView lesson={withTemplate} />);
    await user.click(screen.getByRole('button', { name: FILL_MY_TEMPLATE_LABEL }));
    await user.click(screen.getByRole('button', { name: BTN_FILL_TEMPLATE }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(FILLED_TEMPLATE_DOWNLOAD_MESSAGE);
    });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-error/10', 'text-error');
    expect(alert.querySelector('svg')).toBeInTheDocument();
    expect(alert).not.toHaveTextContent(/TypeError|ByteString|CONTENT_DISPOSITION_FAILED/);
    expect(downloadBlob).not.toHaveBeenCalled();
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
    await user.click(screen.getByRole('button', { name: FILL_MY_TEMPLATE_LABEL }));
    await user.click(screen.getByRole('button', { name: BTN_FILL_TEMPLATE }));

    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledWith(
        expect.any(Blob),
        'Photosynthesis-filled.docx',
      );
    });
    expect(screen.queryByText(TEMPLATE_UNFILLED_ERROR)).not.toBeInTheDocument();
  });
});
