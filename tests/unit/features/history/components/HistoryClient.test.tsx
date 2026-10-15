import { render, screen, waitFor } from '@/tests/helpers';
import { HistoryClient } from '@/features/history/components/HistoryClient';

const mockLessons = [
  {
    id: '1',
    title: 'Oceans',
    subject: 'English',
    grade: '5',
    duration_minutes: 60,
    created_at: '2026-07-10T00:00:00Z',
  },
  {
    id: '2',
    title: 'Nouns',
    subject: 'Math',
    grade: '5',
    duration_minutes: 60,
    created_at: '2026-07-11T00:00:00Z',
  },
];

function createFilteredThenable(data: typeof mockLessons) {
  const query = {
    ilike: jest.fn(function ilike(this: typeof query) {
      return this;
    }),
    then: (
      resolve: (value: { data: typeof mockLessons; error: null }) => void,
      reject?: (reason: unknown) => void,
    ) => Promise.resolve({ data, error: null }).then(resolve, reject),
  };
  return query;
}

function createThenableQuery() {
  const query = {
    eq: jest.fn(function eq(this: typeof query, column: string, value: string) {
      if (column === 'subject') {
        return createFilteredThenable(mockLessons.filter((lesson) => lesson.subject === value));
      }
      return this;
    }),
    ilike: jest.fn(function ilike(this: typeof query) {
      return this;
    }),
    then: (
      resolve: (value: { data: typeof mockLessons; error: null }) => void,
      reject?: (reason: unknown) => void,
    ) => Promise.resolve({ data: mockLessons, error: null }).then(resolve, reject),
  };
  return query;
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => createThenableQuery()),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  })),
}));

jest.mock('@/components/ui/effects/BlurText', () => ({
  BlurText: ({ text }: { text: string }) => <span>{text}</span>,
}));

describe('HistoryClient filter chrome', () => {
  it('styles the search field and subject trigger consistently', async () => {
    render(<HistoryClient />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /all subjects/i })).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox', { name: 'Search lessons by title' });
    expect(searchInput).toBeInTheDocument();

    const searchWrapper = searchInput.parentElement;
    expect(searchWrapper).toHaveClass('h-13');
    expect(searchWrapper).toHaveClass('border-2');

    const searchIcon = searchWrapper!.querySelector('svg');
    expect(searchIcon).toBeTruthy();
    expect(searchIcon).not.toHaveClass('absolute');

    const subjectButton = screen.getByRole('button', { name: /all subjects/i });
    expect(subjectButton).toHaveClass('h-13');
    expect(subjectButton).toHaveClass('border-2');
  });

  it('keeps the subject trigger after selecting one subject and can clear with All subjects', async () => {
    const { user } = render(<HistoryClient />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /all subjects/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /all subjects/i }));
    await user.click(screen.getByRole('option', { name: 'English' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /english/i })).toBeInTheDocument();
    });

    expect(screen.queryByText('Nouns')).not.toBeInTheDocument();
    expect(screen.getByText('Oceans')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /english/i }));
    await user.click(screen.getByRole('option', { name: 'All subjects' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /all subjects/i })).toBeInTheDocument();
    });
    expect(screen.getByText('Oceans')).toBeInTheDocument();
    expect(screen.getByText('Nouns')).toBeInTheDocument();
  });
});
