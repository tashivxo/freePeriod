import { render, screen, waitFor } from '@/tests/helpers';
import { LocaleProvider } from '@/providers/locale';
import type { ReactElement } from 'react';

type LessonRow = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  curriculum: string;
  duration_minutes: number;
  created_at: string;
};

const allLessons: LessonRow[] = [
  {
    id: '1',
    title: 'Fractions',
    subject: 'Mathematics',
    grade: '5',
    curriculum: 'Common Core',
    duration_minutes: 45,
    created_at: '2026-01-02',
  },
  {
    id: '2',
    title: 'Cells',
    subject: 'Science',
    grade: '6',
    curriculum: 'NGSS',
    duration_minutes: 45,
    created_at: '2026-01-01',
  },
];

let lessonRows = [...allLessons];

function createFromMock() {
  const filters: {
    subject: string | null;
    grade: string | null;
    curriculum: string | null;
    titleIlike: string | null;
    columns: string;
  } = {
    subject: null,
    grade: null,
    curriculum: null,
    titleIlike: null,
    columns: '',
  };

  const execute = () => {
    if (filters.columns === 'subject, grade, curriculum') {
      return {
        data: lessonRows.map((row) => ({
          subject: row.subject,
          grade: row.grade,
          curriculum: row.curriculum,
        })),
      };
    }
    let rows = lessonRows;
    if (filters.subject) {
      rows = rows.filter((row) => row.subject === filters.subject);
    }
    if (filters.grade) {
      rows = rows.filter((row) => row.grade === filters.grade);
    }
    if (filters.curriculum) {
      rows = rows.filter((row) => row.curriculum === filters.curriculum);
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
      if (column === 'grade') filters.grade = value;
      if (column === 'curriculum') filters.curriculum = value;
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

function getSearchInput() {
  return screen.getByRole('textbox', { name: /search lessons by title/i });
}

function getSearchField() {
  const input = getSearchInput();
  const field = input.parentElement;
  expect(field).toBeInstanceOf(HTMLElement);
  return { input, field: field as HTMLElement };
}

function getSearchIconWrap(field: HTMLElement) {
  const svg = field.querySelector('svg');
  expect(svg).not.toBeNull();
  const parent = svg!.parentElement;
  const wrap = parent === field ? svg! : (parent as HTMLElement);
  return { svg: svg as SVGElement, wrap };
}

function classOf(el: Element) {
  return el.getAttribute('class') ?? '';
}

describe('HistoryClient', () => {
  beforeEach(() => {
    lessonRows = [...allLessons];
    document.title = '';
  });

  it('sets the browser document title from locale copy', async () => {
    renderHistory();
    await screen.findByRole('heading', { level: 1 });
    expect(document.title).toBe('Lesson Plan History | FreePeriod');
  });

  it('sets the Arabic browser document title instead of leftover English', async () => {
    renderHistory(<HistoryClient />, 'ar');
    await screen.findByRole('heading', { level: 1 });
    expect(document.title).toBe('سجل خطط الدروس | FreePeriod');
    expect(document.title).not.toBe('Lesson Plan History | FreePeriod');
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

  it('lists only distinct subjects in the menu and clears the filter with the X control', async () => {
    const { user } = renderHistory();

    const trigger = await screen.findByRole('button', { name: /all subjects/i });
    await user.click(trigger);
    expect(screen.getByRole('option', { name: 'Science' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Mathematics' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /all subjects/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Science' }));

    await waitFor(() => {
      expect(screen.getByText('Cells')).toBeInTheDocument();
    });
    expect(screen.queryByText('Fractions')).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: /science/i })).toHaveAttribute('aria-haspopup', 'listbox');
    await user.click(screen.getByRole('button', { name: 'Clear subject filter' }));

    await waitFor(() => {
      expect(screen.getByText('Fractions')).toBeInTheDocument();
      expect(screen.getByText('Cells')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /all subjects/i })).toBeInTheDocument();
  });

  it('hides the subject dropdown when the account has only one subject', async () => {
    lessonRows = [allLessons[0]!];
    renderHistory();

    await screen.findByText('Fractions');
    expect(screen.queryByRole('button', { name: /all subjects/i })).not.toBeInTheDocument();
  });

  it('centres the search icon on the input text with logical start inset, not translate hacks', async () => {
    renderHistory();
    await screen.findByRole('heading', { level: 1 });

    const { input, field } = getSearchField();
    const { wrap } = getSearchIconWrap(field);

    expect(classOf(wrap)).toMatch(/\babsolute\b/);
    expect(classOf(wrap)).toMatch(/\binset-y-0\b/);
    expect(classOf(wrap)).toMatch(/\bstart-0\b/);
    expect(classOf(wrap)).toMatch(/\bflex\b/);
    expect(classOf(wrap)).toMatch(/\bitems-center\b/);
    expect(classOf(wrap)).toMatch(/\bpointer-events-none\b/);
    expect(classOf(wrap)).toMatch(/\bps-3\b/);
    expect(classOf(wrap)).not.toMatch(/top-1\/2/);
    expect(classOf(wrap)).not.toMatch(/-translate-y-1\/2/);
    expect(classOf(wrap)).not.toMatch(/\bleft-/);
    expect(classOf(input)).toMatch(/\bps-9\b/);
    expect(classOf(input)).not.toMatch(/\bpl-/);
  });

  it('keeps the search icon logically inset in Arabic RTL at the same classes', async () => {
    document.documentElement.dir = 'rtl';
    renderHistory(<HistoryClient />, 'ar');

    const input = await screen.findByRole('textbox', { name: 'البحث في الدروس حسب العنوان' });
    const field = input.parentElement as HTMLElement;
    const { wrap } = getSearchIconWrap(field);

    expect(document.documentElement.dir).toBe('rtl');
    expect(classOf(wrap)).toMatch(/\bstart-0\b/);
    expect(classOf(wrap)).toMatch(/\binset-y-0\b/);
    expect(classOf(wrap)).toMatch(/\bitems-center\b/);
    expect(classOf(wrap)).not.toMatch(/\bleft-/);
    expect(classOf(input)).toMatch(/\bps-9\b/);
    expect(classOf(input)).toMatch(/\bpe-3\b/);
    document.documentElement.dir = 'ltr';
  });

  it('matches search and filter control height, border, radius, and toolbar layout', async () => {
    renderHistory();
    const trigger = await screen.findByRole('button', { name: /all subjects/i });
    const gradeTrigger = screen.getByRole('button', { name: /all grades/i });
    const { input, field } = getSearchField();
    const filtersRow = field.parentElement as HTMLElement;

    expect(input.className).toMatch(/\bh-13\b/);
    expect(trigger.className).toMatch(/\bh-13\b/);
    expect(gradeTrigger.className).toMatch(/\bh-13\b/);
    expect(input.className).toMatch(/\bborder-2\b/);
    expect(trigger.className).toMatch(/\bborder-2\b/);
    expect(input.className).toMatch(/\brounded-xl\b/);
    expect(trigger.className).toMatch(/\brounded-xl\b/);
    expect(input.className).not.toMatch(/\bpy-2\b/);
    expect(input.className).not.toMatch(/\bmd:text-sm\b/);

    expect(field.className).toMatch(/\bw-full\b/);
    expect(field.className).toMatch(/\bmin-w-0\b/);
    expect(field.className).toMatch(/\bflex-1\b/);
    expect(field.className).not.toMatch(/\blg:max-w-sm\b/);
    expect(filtersRow.className).toMatch(/\bgrid\b/);
    expect(filtersRow.className).toMatch(/\bsm:grid-cols-2\b/);
    expect(filtersRow.className).toMatch(/\blg:grid-cols-none\b/);
    expect(filtersRow.className).toMatch(/\blg:flex\b/);
    expect(trigger.parentElement?.className).toMatch(/lg:min-w-\[9rem\]/);
  });

  it('pins the title and filter row below the nav while lesson cards scroll', async () => {
    const { user } = renderHistory();
    const fractions = await screen.findByText('Fractions');

    const { input } = getSearchField();
    const pageHeader = screen.getByTestId('history-page-header');
    expect(classOf(pageHeader)).toMatch(/\bsticky\b/);
    expect(classOf(pageHeader)).toMatch(/\btop-14\b/);
    expect(classOf(pageHeader)).toMatch(/\bbg-background\b/);
    expect(classOf(pageHeader)).not.toMatch(/bg-background\/90/);
    expect(classOf(pageHeader)).not.toMatch(/backdrop-blur/);

    expect(pageHeader.contains(fractions)).toBe(false);
    expect(pageHeader.contains(input)).toBe(true);
    expect(pageHeader).toContainElement(screen.getByRole('heading', { level: 1 }));

    await user.click(screen.getByRole('button', { name: /all subjects/i }));
    const listbox = screen.getByRole('listbox');
    expect(document.body.contains(listbox)).toBe(true);
    expect(pageHeader.contains(listbox)).toBe(false);
  });

  it('shows grade and curriculum filters when at least two distinct values exist', async () => {
    const { user } = renderHistory();
    await screen.findByText('Fractions');

    const gradeTrigger = screen.getByRole('button', { name: /all grades/i });
    const curriculumTrigger = screen.getByRole('button', { name: /all curricula/i });

    await user.click(gradeTrigger);
    expect(screen.getByRole('option', { name: /grade.*5/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /grade.*6/i })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(curriculumTrigger);
    expect(screen.getByRole('option', { name: 'Common Core' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'NGSS' })).toBeInTheDocument();
  });

  it('narrows results when grade and curriculum filters are active', async () => {
    const { user } = renderHistory();
    await screen.findByText('Fractions');

    await user.click(screen.getByRole('button', { name: /all grades/i }));
    await user.click(screen.getByRole('option', { name: /grade.*5/i }));
    await waitFor(() => {
      expect(screen.getByText('Fractions')).toBeInTheDocument();
      expect(screen.queryByText('Cells')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Clear grade filter' }));

    await user.click(screen.getByRole('button', { name: /all curricula/i }));
    await user.click(screen.getByRole('option', { name: 'NGSS' }));
    await waitFor(() => {
      expect(screen.getByText('Cells')).toBeInTheDocument();
      expect(screen.queryByText('Fractions')).not.toBeInTheDocument();
    });
  });

  it('hides grade or curriculum dropdowns when fewer than two distinct values exist', async () => {
    lessonRows = [
      allLessons[0]!,
      { ...allLessons[0]!, id: '3', title: 'Decimals', subject: 'Mathematics' },
    ];
    renderHistory();
    await screen.findByText('Fractions');

    expect(screen.queryByRole('button', { name: /all grades/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /all curricula/i })).not.toBeInTheDocument();
  });
});
