import { render, screen, waitFor } from '@/lib/test-utils';
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

jest.mock('@/components/ui/BlurText', () => ({
  BlurText: ({ text, className }: { text: string; className?: string }) => (
    <h1 className={className}>{text}</h1>
  ),
}));

jest.mock('./SectionCard', () => ({
  SectionCard: ({ title }: { title: string }) => <div>{title}</div>,
}));

import { useDebouncedLessonSave } from '@/hooks/useDebouncedLessonSave';
import { LessonView } from './LessonView';

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

  it('shows save status text in the header', () => {
    (useDebouncedLessonSave as jest.Mock).mockReturnValue({
      save: mockSave,
      status: 'saved',
      error: null,
    });

    render(<LessonView lesson={lesson} />);

    expect(screen.getByRole('status')).toHaveTextContent('Saved');
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
});
