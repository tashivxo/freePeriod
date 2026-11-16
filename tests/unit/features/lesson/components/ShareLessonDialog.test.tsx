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

    expect(screen.getByRole('status')).toHaveTextContent('Preparing your share link…');
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

  it('shows a download error when the file download fails', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => shareResult,
      })
      .mockResolvedValueOnce({ ok: false }) as typeof fetch;

    const { user } = render(<ShareLessonDialog {...defaultProps} />);

    expect(await screen.findByRole('button', { name: 'Download file' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Download file' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't download file. Try again.");
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

describe('ShareLessonDialog share URL row', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => shareResult,
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    document.documentElement.removeAttribute('dir');
  });

  it('vertically centers the copy button with the URL field and matches field height', async () => {
    render(<ShareLessonDialog {...defaultProps} />);

    const copyButton = await screen.findByRole('button', { name: 'Copy link' });
    const urlField = screen.getByLabelText('Share link');

    expect(copyButton).toHaveClass('h-11', 'shrink-0');
    expect(copyButton).not.toHaveClass('h-9', 'h-10');

    const urlRow = urlField.parentElement;
    expect(urlRow).toHaveClass('flex', 'items-center', 'gap-2');
  });

  it('keeps URL row alignment classes in RTL', async () => {
    document.documentElement.dir = 'rtl';

    render(<ShareLessonDialog {...defaultProps} />);

    const copyButton = await screen.findByRole('button', { name: 'Copy link' });
    const urlField = screen.getByLabelText('Share link');

    expect(copyButton).toHaveClass('h-11', 'shrink-0');
    expect(urlField.parentElement).toHaveClass('flex', 'items-center', 'gap-2');
  });

  it('renders the share URL input with dir ltr so the link start is visible in RTL', async () => {
    document.documentElement.dir = 'rtl';

    render(<ShareLessonDialog {...defaultProps} />);

    const urlField = await screen.findByLabelText('Share link');
    expect(urlField).toHaveAttribute('dir', 'ltr');
  });
});