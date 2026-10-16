import { render, screen, waitFor } from '@/tests/helpers';
import { LocaleProvider } from '@/providers/locale';
import type { ReactElement } from 'react';

type LessonRow = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  duration_minutes: number;
  created_at: string;
};

const allLessons: LessonRow[] = [
  {
    id: '1',
    title: 'Fractions',
    subject: 'Mathematics',
    grade: '5',
    duration_minutes: 45,
    created_at: '2026-01-02',
  },
  {
    id: '2',
    title: 'Cells',
    subject: 'Science',
    grade: '6',
    duration_minutes: 45,
    created_at: '2026-01-01',
  },
];

let lessonRows = [...allLessons];

function createFromMock() {
  const filters: { subject: string | null; titleIlike: string | null; columns: string } = {
    subject: null,
    titleIlike: null,
    columns: '',
  };

  const execute = () => {
    if (filters.columns === 'subject') {
      return { data: lessonRows.map((row) => ({ subject: row.subject })) };
    }
    let rows = lessonRows;
    if (filters.subject) {
      rows = rows.filter((row) => row.subject === filters.subject);
    }
    if (filters.titleIlike) {
      const term = filters.titleIlike.replace(/%/g, '').toLowerCase();
      rows = rows.filter((row) => row.title.toLowerCase().includes(term));
    }
    return { data: rows };
  };

  const chain: {
    select: jest.Mock;
    order: jest.Mock;
    eq: jest.Mock;
    ilike: jest.Mock;
    delete: jest.Mock;
    then: (resolve: (value: { data: unknown }) => unknown) => Promise<unknown>;
  } = {
    select: jest.fn((columns: string) => {
      filters.columns = columns;
      return chain;
    }),
    order: jest.fn(() => chain),
    eq: jest.fn((column: string, value: string) => {
      if (column === 'subject') filters.subject = value;
      return chain;
    }),
    ilike: jest.fn((_column: string, value: string) => {
      filters.titleIlike = value;
      return chain;
    }),
    delete: jest.fn(() => ({
      eq: jest.fn().mockResolvedValue({ error: null }),
    })),
    then: (resolve) => Promise.resolve(execute()).then(resolve),
  };

  return chain;
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => createFromMock()),
  })),
}));

import { HistoryClient } from '@/features/history/components/HistoryClient';

function renderHistory(ui: ReactElement = <HistoryClient />, locale: 'en' | 'ar' = 'en') {
  return render(<LocaleProvider initialLocale={locale}>{ui}</LocaleProvider>);
}

describe('HistoryClient', () => {
  beforeEach(() => {
    lessonRows = [...allLessons];
  });

  it('keeps the heading and Plan Lesson action as separate elements', async () => {
    renderHistory();

    const heading = await screen.findByRole('heading', { level: 1 });
    const planLesson = await screen.findByRole('link', { name: /plan lesson/i });

    expect(heading).not.toContainElement(planLesson);
    expect(heading.compareDocumentPosition(planLesson) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(heading.textContent?.replace(/\s+/g, ' ').trim()).not.toMatch(/HistoryPlan Lesson/i);
    expect(planLesson).toHaveAttribute('href', '/generate');
  });

  it('uses a logical word separator so RTL does not concatenate HistoryPlan Lesson', async () => {
    document.documentElement.dir = 'rtl';
    renderHistory(<HistoryClient />, 'ar');

    const heading = await screen.findByRole('heading', { level: 1 });
    const wordSpans = heading.querySelectorAll('span');
    expect(wordSpans.length).toBeGreaterThan(1);
    wordSpans.forEach((span, index) => {
      if (index < wordSpans.length - 1) {
        expect(span).toHaveStyle({ marginInlineEnd: '0.3em' });
      }
    });
    expect(heading.textContent?.replace(/\s+/g, '')).not.toBe('HistoryPlanLesson');
    document.documentElement.dir = 'ltr';
  });

  it('translates the search placeholder in Arabic', async () => {
    renderHistory(<HistoryClient />, 'ar');

    expect(await screen.findByPlaceholderText('ابحث حسب العنوان...')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search by title...')).not.toBeInTheDocument();
  });

  it('keeps the subject dropdown after a subject is picked and restores All subjects', async () => {
    const { user } = renderHistory();

    const trigger = await screen.findByRole('button', { name: /all subjects/i });
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Science' }));

    await waitFor(() => {
      expect(screen.getByText('Cells')).toBeInTheDocument();
    });
    expect(screen.queryByText('Fractions')).not.toBeInTheDocument();

    const filteredTrigger = screen.getByRole('button', { name: /science/i });
    expect(filteredTrigger).toHaveAttribute('aria-haspopup', 'listbox');
    await user.click(filteredTrigger);
    await user.click(screen.getByRole('option', { name: /all subjects/i }));

    await waitFor(() => {
      expect(screen.getByText('Fractions')).toBeInTheDocument();
      expect(screen.getByText('Cells')).toBeInTheDocument();
    });
  });

  it('hides the subject dropdown when the account has only one subject', async () => {
    lessonRows = [allLessons[0]!];
    renderHistory();

    await screen.findByText('Fractions');
    expect(screen.queryByRole('button', { name: /all subjects/i })).not.toBeInTheDocument();
  });
});
