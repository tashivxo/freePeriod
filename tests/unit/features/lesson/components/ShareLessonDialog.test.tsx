import { render, screen, waitFor } from '@/tests/helpers';
import { ShareLessonDialog } from '@/features/lesson/components/ShareLessonDialog';

const shareResult = {
  url: 'https://example.test/s/token-1',
  fileName: 'Fractions.docx',
  contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  usedDocxFallback: false,
  token: 'token-1',
};

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  lessonId: 'lesson-1',
  lessonTitle: 'Fractions',
};

describe('ShareLessonDialog preparing state', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows a spinner and preparing copy while the share request is pending', () => {
    global.fetch = jest.fn(
      () =>
        new Promise(() => {
          /* intentional hang */
        }),
    ) as typeof fetch;

    render(<ShareLessonDialog {...defaultProps} />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Preparing your share link…');
    expect(status.querySelector('svg')).toHaveClass('motion-safe:animate-spin');
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows copy link after the share request succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => shareResult,
    }) as typeof fetch;

    render(<ShareLessonDialog {...defaultProps} />);

    expect(await screen.findByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-busy');
  });

  it('shows an error without a spinner when the share request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    }) as typeof fetch;

    render(<ShareLessonDialog {...defaultProps} />);

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't create share link. Try again.");
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-busy'));
  });
});