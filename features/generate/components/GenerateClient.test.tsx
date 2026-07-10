import { render, screen, waitFor } from '@/lib/test-utils';
import { TextDecoder } from 'util';

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: { id: 'upload-123' }, error: null }),
        })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'user-123/file.pdf' }, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  })),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('animejs', () => ({
  __esModule: true,
  default: jest.fn(() => ({ finished: Promise.resolve() })),
  animate: jest.fn(() => ({ finished: Promise.resolve() })),
  remove: jest.fn(),
}));

import { GenerateClient } from './GenerateClient';

const defaults = {
  subject: 'Mathematics',
  grade: '9',
  curriculum: 'CAPS (South Africa)',
};

describe('GenerateClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn(
      () =>
        new Promise(() => {
          /* keep loading screen visible */
        }),
    );
  });

  it('shows the generation loading screen after the user submits the form', async () => {
    const { user } = render(<GenerateClient defaults={defaults} />);

    await user.click(screen.getByRole('button', { name: /generate lesson plan/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('status', { name: /generating lesson plan/i }),
      ).toBeInTheDocument();
    });
  });

  it('shows the animated logo on the loading screen', async () => {
    const { user } = render(<GenerateClient defaults={defaults} />);

    await user.click(screen.getByRole('button', { name: /generate lesson plan/i }));

    await waitFor(() => {
      expect(screen.getByTestId('animated-logo')).toBeInTheDocument();
    });
  });

  it('shows the default loading message while waiting for stream events', async () => {
    const { user } = render(<GenerateClient defaults={defaults} />);

    await user.click(screen.getByRole('button', { name: /generate lesson plan/i }));

    await waitFor(() => {
      expect(screen.getByText(/generating your lesson plan/i)).toBeInTheDocument();
    });
  });

  it('does not show the loading screen before generate is clicked', () => {
    render(<GenerateClient defaults={defaults} />);

    expect(
      screen.queryByRole('status', { name: /generating lesson plan/i }),
    ).not.toBeInTheDocument();
  });

  it('navigates to the lesson page when generation completes', async () => {
    const toBytes = (value: string) => Uint8Array.from(value, (char) => char.charCodeAt(0));
    const chunks = [
      'data: {"type":"status","message":"Starting generation…"}\n\n',
      'data: {"type":"complete","lessonId":"lesson-xyz","usage":{"inputTokens":1,"outputTokens":2}}\n\n',
    ];
    let chunkIndex = 0;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: async () => {
            if (chunkIndex < chunks.length) {
              return { done: false, value: toBytes(chunks[chunkIndex++]) };
            }
            return { done: true, value: undefined };
          },
        }),
      },
    });

    const { user } = render(<GenerateClient defaults={defaults} />);

    await user.click(screen.getByRole('button', { name: /generate lesson plan/i }));

    await waitFor(() => {
      expect(screen.getByText(/lesson plan complete/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/lesson/lesson-xyz');
    });
  });
});
