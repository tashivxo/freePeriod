import { act, fireEvent } from '@testing-library/react';
import { render, screen, waitFor, within } from '@/tests/helpers';
import { LocaleProvider } from '@/providers/locale';
import type { ReactElement } from 'react';

const HISTORY_LESSON_SCROLL_KEY = 'freeperiod:history-lesson-scroll';

const MOBILE_QUERY = '(max-width: 639px)';
const COMPACT_TOOLBAR_QUERY = '(max-width: 1023px)';

function setCompactViewport() {
  const original = window.matchMedia;
  window.matchMedia = jest.fn((query: string) => {
    const compact = query === COMPACT_TOOLBAR_QUERY || query === MOBILE_QUERY;
    if (compact) {
      return {
        matches: true,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      };
    }
    return original(query);
  }) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

function setMobileViewport() {
  return setCompactViewport();
}

function getCompactFacetGrid() {
  return screen.getByTestId('history-facet-grid');
}

function compactFacetTrigger(name: string) {
  return within(getToolbar()).getByRole('button', { name: new RegExp(`^${name}$`, 'i') });
}

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

const momLessons: LessonRow[] = [
  {
    id: 'm1',
    title: 'English 5',
    subject: 'English',
    grade: '5',
    curriculum: 'National',
    duration_minutes: 45,
    created_at: '2026-01-03',
  },
  {
    id: 'm2',
    title: 'Arabic 8',
    subject: 'Arabic',
    grade: '8',
    curriculum: 'National',
    duration_minutes: 45,
    created_at: '2026-01-02',
  },
  {
    id: 'm3',
    title: 'English 11',
    subject: 'English',
    grade: '11',
    curriculum: 'National',
    duration_minutes: 45,
    created_at: '2026-01-01',
  },
];

let lessonRows = [...allLessons];

const lastLessonFetch = {
  subject: null as string | null,
  grade: null as string | null,
  curriculum: null as string | null,
  titleIlike: null as string | null,
};

function resetLastLessonFetch() {
  lastLessonFetch.subject = null;
  lastLessonFetch.grade = null;
  lastLessonFetch.curriculum = null;
  lastLessonFetch.titleIlike = null;
}

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
    lastLessonFetch.subject = filters.subject;
    lastLessonFetch.grade = filters.grade;
    lastLessonFetch.curriculum = filters.curriculum;
    lastLessonFetch.titleIlike = filters.titleIlike;
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

function getToolbar() {
  return screen.getByTestId('history-toolbar');
}

function getSearchInput() {
  return within(getToolbar()).getByRole('textbox', { name: /search lessons by title/i });
}

function getSearchField() {
  const input = getSearchInput();
  const field = input.parentElement;
  expect(field).toBeInstanceOf(HTMLElement);
  return { input, field: field as HTMLElement };
}

function getDesktopHeader() {
  return screen.getByTestId('history-page-header');
}

function getPageTitleBlock() {
  return screen.getByTestId('history-page-title');
}

function getPinnedTitleHeading() {
  return within(getPageTitleBlock()).getByRole('heading', { level: 1 });
}

async function findPinnedTitleHeading() {
  return within(getPageTitleBlock()).findByRole('heading', { level: 1 });
}

function getMobileToolbarRow() {
  return screen.getByTestId('history-mobile-toolbar-row');
}


function duplicateElementIds(root: ParentNode) {
  const counts = new Map<string, number>();
  root.querySelectorAll('[id]').forEach((el) => {
    counts.set(el.id, (counts.get(el.id) ?? 0) + 1);
  });
  return [...counts.entries()].filter(([, count]) => count > 1);
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

function expectHeaderHasNoChromeFrost(className: string) {
  expect(className).not.toMatch(/(?:^|\s)bg-background(?:\s|$)/);
  expect(className).not.toMatch(/bg-background\/\d+/);
  expect(className).not.toMatch(/backdrop-blur/);
  expect(className).not.toMatch(/\bborder-b\b/);
  expect(className).not.toMatch(/max-sm:border-b/);
  expect(className).not.toMatch(/\bshadow\b/);
}

describe('HistoryClient', () => {
  beforeEach(() => {
    lessonRows = [...allLessons];
    resetLastLessonFetch();
    document.title = '';
    sessionStorage.clear();
  });

  it('sets the browser document title from locale copy', async () => {
    renderHistory();
    await findPinnedTitleHeading();
    expect(document.title).toBe('Lesson Plan History | FreePeriod');
  });

  it('sets the Arabic browser document title instead of leftover English', async () => {
    renderHistory(<HistoryClient />, 'ar');
    await findPinnedTitleHeading();
    expect(document.title).toBe('سجل خطط الدروس | FreePeriod');
    expect(document.title).not.toBe('Lesson Plan History | FreePeriod');
  });

  it('keeps the heading and Plan Lesson action as separate elements', async () => {
    renderHistory();

    const heading = await findPinnedTitleHeading();
    const planLesson = within(getPageTitleBlock()).getByRole('link', { name: /plan lesson/i });

    expect(heading).not.toContainElement(planLesson);
    expect(heading.compareDocumentPosition(planLesson) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(heading.textContent?.replace(/\s+/g, ' ').trim()).not.toMatch(/HistoryPlan Lesson/i);
    expect(planLesson).toHaveAttribute('href', '/generate');
  });

  it('uses a logical word separator so RTL does not concatenate HistoryPlan Lesson', async () => {
    document.documentElement.dir = 'rtl';
    renderHistory(<HistoryClient />, 'ar');

    const heading = getPinnedTitleHeading();
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

    expect(await within(getToolbar()).findByPlaceholderText('ابحث حسب العنوان...')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search by title...')).not.toBeInTheDocument();
  });

  it('lists only distinct subjects in the menu and clears the filter with the X control', async () => {
    const { user } = renderHistory();

    const trigger = await within(getToolbar()).findByRole('button', { name: /all subjects/i });
    await user.click(trigger);
    expect(screen.getByRole('option', { name: 'Science' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Mathematics' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /all subjects/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Science' }));

    await waitFor(() => {
      expect(screen.getByText('Cells')).toBeInTheDocument();
    });
    expect(screen.queryByText('Fractions')).not.toBeInTheDocument();

    expect(within(getToolbar()).getByRole('button', { name: /science/i })).toHaveAttribute(
      'aria-haspopup',
      'listbox',
    );
    await user.click(within(getToolbar()).getByRole('button', { name: 'Clear subject filter' }));

    await waitFor(() => {
      expect(screen.getByText('Fractions')).toBeInTheDocument();
      expect(screen.getByText('Cells')).toBeInTheDocument();
    });
    expect(within(getToolbar()).getByRole('button', { name: /all subjects/i })).toBeInTheDocument();
  });

  it('shows the subject dropdown when the account has only one subject', async () => {
    lessonRows = [allLessons[0]!];
    const { user } = renderHistory();

    await screen.findByText('Fractions');
    expect(within(getToolbar()).getByRole('button', { name: /all subjects/i })).toBeInTheDocument();
    expect(within(getToolbar()).getByRole('button', { name: /all grades/i })).toBeInTheDocument();
    expect(within(getToolbar()).getByRole('button', { name: /all curricula/i })).toBeInTheDocument();

    await user.click(within(getToolbar()).getByRole('button', { name: /all subjects/i }));
    expect(screen.getByRole('option', { name: 'Mathematics' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('centres the search icon on the input text with logical start inset, not translate hacks', async () => {
    renderHistory();
    await findPinnedTitleHeading();

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

    const input = await within(getToolbar()).findByRole('textbox', {
      name: 'البحث في الدروس حسب العنوان',
    });
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
    const trigger = await within(getToolbar()).findByRole('button', { name: /all subjects/i });
    const gradeTrigger = within(getToolbar()).getByRole('button', { name: /all grades/i });
    const { input, field } = getSearchField();
    const facetGrid = getCompactFacetGrid();

    expect(input.className).toMatch(/\blg:h-13\b/);
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
    expect(classOf(facetGrid)).toMatch(/\bmax-lg:flex\b/);
    expect(classOf(facetGrid)).toMatch(/\bgap-2\b/);
    expect(classOf(facetGrid)).toMatch(/\blg:contents\b/);
    expect(classOf(facetGrid)).not.toMatch(/\bgrid-cols-3\b/);
    expect(trigger.parentElement?.className).toMatch(/lg:min-w-\[9rem\]/);
  });

  it('keeps the title and filters above the lesson scroll pane while cards scroll inside it', async () => {
    const { user } = renderHistory();
    const fractions = await screen.findByText('Fractions');

    const { input } = getSearchField();
    const pageHeader = getDesktopHeader();
    const toolbarRow = getMobileToolbarRow();
    const scroller = screen.getByTestId('history-lesson-scroller');
    const toolbar = getToolbar();
    expectHeaderHasNoChromeFrost(classOf(pageHeader));
    expectHeaderHasNoChromeFrost(classOf(toolbar));
    expect(classOf(pageHeader)).not.toMatch(/\bsm:sticky\b/);
    expect(classOf(pageHeader)).not.toMatch(/\bsm:top-14\b/);

    expect(scroller).toContainElement(fractions);
    expect(pageHeader.contains(fractions)).toBe(false);
    expect(toolbarRow.contains(toolbar)).toBe(true);
    expect(toolbar.contains(input)).toBe(true);
    expect(pageHeader).toContainElement(within(getPageTitleBlock()).getByRole('heading', { level: 1 }));
    expect(pageHeader.compareDocumentPosition(toolbarRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(toolbarRow.compareDocumentPosition(scroller) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(within(getToolbar()).getByRole('button', { name: /all subjects/i }));
    const listbox = screen.getByRole('listbox');
    expect(document.body.contains(listbox)).toBe(true);
    expect(pageHeader.contains(listbox)).toBe(false);
  });

  it('renders lesson cards inside the dedicated scroll pane below the toolbar', async () => {
    renderHistory();
    const fractions = await screen.findByText('Fractions');
    const cells = screen.getByText('Cells');
    const scroller = screen.getByTestId('history-lesson-scroller');

    expect(scroller).toContainElement(fractions);
    expect(scroller).toContainElement(cells);
    expect(classOf(scroller)).toMatch(/\boverflow-y-auto\b/);
    expect(classOf(scroller)).toMatch(/\bmin-h-0\b/);
  });

  it('pads the scroll pane so card shadows and focus rings are not clipped', async () => {
    renderHistory();
    await screen.findByText('Fractions');
    const scroller = screen.getByTestId('history-lesson-scroller');
    const inner = scroller.firstElementChild;
    expect(inner).toBeInstanceOf(HTMLElement);
    expect(classOf(inner as HTMLElement)).toMatch(/\bpt-2\b/);
    expect(classOf(inner as HTMLElement)).toMatch(/\bpx-0\.5\b/);
  });

  it('restores lesson scroll position from sessionStorage when the page mounts', async () => {
    sessionStorage.setItem(HISTORY_LESSON_SCROLL_KEY, '240');
    renderHistory();
    await screen.findByText('Fractions');
    const scroller = screen.getByTestId('history-lesson-scroller');
    await waitFor(() => {
      expect(scroller.scrollTop).toBe(240);
    });
  });

  it('persists lesson scroll position to sessionStorage while scrolling the pane', async () => {
    renderHistory();
    await screen.findByText('Fractions');
    const scroller = screen.getByTestId('history-lesson-scroller');
    Object.defineProperty(scroller, 'scrollTop', { writable: true, configurable: true, value: 180 });
    fireEvent.scroll(scroller);
    await waitFor(() => {
      expect(sessionStorage.getItem(HISTORY_LESSON_SCROLL_KEY)).toBe('180');
    });
  });

  it('renders exactly one history toolbar in the document', async () => {
    renderHistory();
    await screen.findByText('Fractions');
    expect(screen.getAllByTestId('history-toolbar')).toHaveLength(1);
  });

  it('does not duplicate element ids within the History client render', async () => {
    const { container } = renderHistory();
    await screen.findByText('Fractions');
    expect(duplicateElementIds(container)).toEqual([]);
  });

  it('renders a single pinned page title above the toolbar on every viewport', async () => {
    renderHistory();
    await screen.findByText('Fractions');
    const title = getPageTitleBlock();
    const toolbarRow = getMobileToolbarRow();
    const toolbar = getToolbar();
    const scroller = screen.getByTestId('history-lesson-scroller');
    const { input } = getSearchField();

    expect(screen.queryByTestId('history-page-title-desktop')).not.toBeInTheDocument();
    expect(screen.queryByTestId('history-page-title-mobile')).not.toBeInTheDocument();
    expect(title.compareDocumentPosition(toolbarRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(toolbar.contains(input)).toBe(true);
    expect(input.compareDocumentPosition(getCompactFacetGrid()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(scroller.contains(title)).toBe(false);
    expect(toolbarRow.compareDocumentPosition(scroller) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps the same search input element when the viewport media query changes', async () => {
    const mediaListeners = new Map<string, Set<() => void>>();
    const originalMatchMedia = window.matchMedia;
    let mobileMatches = false;

    window.matchMedia = jest.fn((query: string) => {
      const listeners = mediaListeners.get(query) ?? new Set<() => void>();
      mediaListeners.set(query, listeners);
      return {
        matches: query === MOBILE_QUERY ? mobileMatches : originalMatchMedia(query).matches,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: (type: string, listener: () => void) => {
          if (type === 'change') listeners.add(listener);
        },
        removeEventListener: (type: string, listener: () => void) => {
          if (type === 'change') listeners.delete(listener);
        },
        dispatchEvent: () => false,
      };
    }) as typeof window.matchMedia;

    const { user } = renderHistory();
    await screen.findByText('Fractions');
    const input = getSearchInput();
    await user.click(input);
    await user.type(input, 'cel');
    expect(input).toHaveFocus();

    mobileMatches = true;
    act(() => {
      mediaListeners.get(MOBILE_QUERY)?.forEach((listener) => listener());
    });

    const inputAfterChange = getSearchInput();
    expect(inputAfterChange).toBe(input);
    expect(inputAfterChange).toHaveValue('cel');
    expect(inputAfterChange).toHaveFocus();

    window.matchMedia = originalMatchMedia;
  });

  it('shows grade and curriculum filters when at least two distinct values exist', async () => {
    const { user } = renderHistory();
    await screen.findByText('Fractions');

    const gradeTrigger = within(getToolbar()).getByRole('button', { name: /all grades/i });
    const curriculumTrigger = within(getToolbar()).getByRole('button', { name: /all curricula/i });

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

    await user.click(within(getToolbar()).getByRole('button', { name: /all grades/i }));
    await user.click(screen.getByRole('option', { name: /grade.*5/i }));
    await waitFor(() => {
      expect(screen.getByText('Fractions')).toBeInTheDocument();
      expect(screen.queryByText('Cells')).not.toBeInTheDocument();
    });

    await user.click(within(getToolbar()).getByRole('button', { name: 'Clear grade filter' }));

    await user.click(within(getToolbar()).getByRole('button', { name: /all curricula/i }));
    await user.click(screen.getByRole('option', { name: 'NGSS' }));
    await waitFor(() => {
      expect(screen.getByText('Cells')).toBeInTheDocument();
      expect(screen.queryByText('Fractions')).not.toBeInTheDocument();
    });
  });

  it('shows all three dropdowns when only one curriculum exists', async () => {
    lessonRows = momLessons;
    const { user } = renderHistory();
    await screen.findByText('English 5');

    expect(within(getToolbar()).getByRole('button', { name: /all subjects/i })).toBeInTheDocument();
    expect(within(getToolbar()).getByRole('button', { name: /all grades/i })).toBeInTheDocument();
    expect(within(getToolbar()).getByRole('button', { name: /all curricula/i })).toBeInTheDocument();

    await user.click(within(getToolbar()).getByRole('button', { name: /all curricula/i }));
    expect(screen.getByRole('option', { name: 'National' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('shows empty Subject, Grade and Curriculum dropdowns when no facet values exist', async () => {
    lessonRows = [];
    const { user } = renderHistory();
    await screen.findByText('No lessons yet.');

    expect(within(getToolbar()).getByRole('button', { name: /all subjects/i })).toBeInTheDocument();
    expect(within(getToolbar()).getByRole('button', { name: /all grades/i })).toBeInTheDocument();
    expect(within(getToolbar()).getByRole('button', { name: /all curricula/i })).toBeInTheDocument();

    await user.click(within(getToolbar()).getByRole('button', { name: /all subjects/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    await user.keyboard('{Escape}');

    await user.click(within(getToolbar()).getByRole('button', { name: /all grades/i }));
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    await user.keyboard('{Escape}');

    await user.click(within(getToolbar()).getByRole('button', { name: /all curricula/i }));
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('keeps the desktop toolbar without a Filters button, chips, or sheet', async () => {
    renderHistory();
    await screen.findByText('Fractions');

    expect(screen.queryByRole('button', { name: /^Filters$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('history-filter-chips')).not.toBeInTheDocument();
    expect(within(getToolbar()).getByRole('button', { name: /all subjects/i })).toBeInTheDocument();
    expect(within(getToolbar()).getByRole('button', { name: /all grades/i })).toBeInTheDocument();
    expect(within(getToolbar()).getByRole('button', { name: /all curricula/i })).toBeInTheDocument();
  });

  describe('mobile toolbar', () => {
    let restoreMatchMedia: () => void;

    beforeEach(() => {
      restoreMatchMedia = setMobileViewport();
    });

    afterEach(() => {
      restoreMatchMedia();
    });

    it('pins the title, search, and facet dropdowns without a Filters sheet or chip row', async () => {
      renderHistory();
      const fractions = await screen.findByText('Fractions');

      const toolbarRow = getMobileToolbarRow();
      const toolbar = getToolbar();
      const title = getPageTitleBlock();
      const scroller = screen.getByTestId('history-lesson-scroller');
      const { input } = getSearchField();
      const facetRow = getCompactFacetGrid();

      expect(classOf(toolbarRow)).toMatch(/\bshrink-0\b/);
      expect(classOf(toolbarRow)).toMatch(/\bpy-3\b/);
      expect(classOf(toolbar)).not.toMatch(/(?:^|\s)sticky\b/);
      expect(classOf(toolbar)).not.toMatch(/(?:^|\s)top-14\b/);
      expectHeaderHasNoChromeFrost(classOf(toolbar));
      expect(toolbar.contains(input)).toBe(true);
      expect(input.className).toMatch(/\bh-11\b/);
      expect(screen.queryByRole('button', { name: /^Filters/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByTestId('history-filter-chips')).not.toBeInTheDocument();
      expect(compactFacetTrigger('Subject')).toBeInTheDocument();
      expect(compactFacetTrigger('Grade')).toBeInTheDocument();
      expect(compactFacetTrigger('Curriculum')).toBeInTheDocument();
      expect(classOf(compactFacetTrigger('Subject'))).toMatch(/\bh-11\b/);
      expect(classOf(facetRow)).toMatch(/\bflex\b/);
      expect(classOf(facetRow)).toMatch(/\bgap-2\b/);
      expect(classOf(facetRow)).not.toMatch(/\bgrid-cols-3\b/);
      expect(classOf(compactFacetTrigger('Subject').parentElement as HTMLElement)).toMatch(/flex-\[1_1_auto\]/);
      expect(classOf(compactFacetTrigger('Subject').parentElement as HTMLElement)).toMatch(/\bbasis-auto\b/);
      expect(classOf(compactFacetTrigger('Subject').parentElement as HTMLElement)).toMatch(/\bmin-w-0\b/);

      expect(title.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(input.compareDocumentPosition(facetRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(scroller.contains(title)).toBe(false);
      expect(scroller).toContainElement(fractions);
      expect(screen.getAllByTestId('history-toolbar')).toHaveLength(1);
    });

    it('places the mobile toolbar row above the scroll pane without overlapping it', async () => {
      renderHistory();
      await screen.findByText('Fractions');

      const toolbarRow = getMobileToolbarRow();
      const scroller = screen.getByTestId('history-lesson-scroller');
      expect(scroller.compareDocumentPosition(toolbarRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeFalsy();
      expect(scroller.compareDocumentPosition(toolbarRow) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
      expect(toolbarRow.contains(scroller)).toBe(false);
    });

    it('filters lessons from inline facet dropdowns and clears with the X control', async () => {
      const { user } = renderHistory();
      await screen.findByText('Fractions');

      await user.click(compactFacetTrigger('Subject'));
      await user.click(screen.getByRole('option', { name: 'Science' }));
      await waitFor(() => {
        expect(screen.queryByText('Fractions')).not.toBeInTheDocument();
        expect(screen.getByText('Cells')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('history-filter-chips')).not.toBeInTheDocument();

      await user.click(within(getToolbar()).getByRole('button', { name: 'Clear subject filter' }));
      await waitFor(() => {
        expect(screen.getByText('Fractions')).toBeInTheDocument();
      });
    });

    it('uses tight compact facet triggers with a 12px chevron and no truncated placeholders', async () => {
      renderHistory();
      await screen.findByText('Fractions');

      const curriculumTrigger = compactFacetTrigger('Curriculum');
      expect(classOf(curriculumTrigger)).toMatch(/\bpx-2\b/);
      expect(classOf(curriculumTrigger)).toMatch(/\bgap-1\.5\b/);
      expect(classOf(curriculumTrigger)).toMatch(/\bh-11\b/);
      const valueSpan = curriculumTrigger.querySelector('span');
      expect(valueSpan).not.toBeNull();
      expect(classOf(valueSpan as HTMLElement)).toMatch(/\bshrink-0\b/);
      expect(classOf(valueSpan as HTMLElement)).not.toMatch(/\btruncate\b/);
      const chevron = curriculumTrigger.querySelector('svg');
      expect(chevron).not.toBeNull();
      expect(classOf(chevron as SVGElement)).toMatch(/\bh-\[12px\]/);
    });

    it('truncates only the selected value label on compact facet triggers', async () => {
      lessonRows = [
        {
          ...allLessons[0]!,
          curriculum: 'International Baccalaureate Middle Years Programme',
        },
      ];
      const { user } = renderHistory();
      await screen.findByText('Fractions');
      await user.click(compactFacetTrigger('Curriculum'));
      await user.click(
        screen.getByRole('option', { name: 'International Baccalaureate Middle Years Programme' }),
      );
      const curriculumTrigger = within(getToolbar()).getByRole('button', {
        name: /International Baccalaureate/,
      });
      const valueSpan = curriculumTrigger.querySelector('span');
      expect(valueSpan).not.toBeNull();
      expect(classOf(valueSpan as HTMLElement)).toMatch(/\btruncate\b/);
    });

    it('shows unpicked Currículo in full for Spanish', async () => {
      renderHistory(<HistoryClient />, 'es');
      await screen.findByText('Fractions');
      const curriculum = within(getToolbar()).getByRole('button', { name: 'Currículo' });
      const label = curriculum.querySelector('span');
      expect(label).not.toBeNull();
      expect(classOf(label as HTMLElement)).not.toMatch(/\btruncate\b/);
      expect(label).toHaveTextContent(/^Currículo$/);
    });

    it('shows unpicked Programme in full for French', async () => {
      renderHistory(<HistoryClient />, 'fr');
      await screen.findByText('Fractions');
      const programme = within(getToolbar()).getByRole('button', { name: 'Programme' });
      const frLabel = programme.querySelector('span');
      expect(classOf(frLabel as HTMLElement)).not.toMatch(/\btruncate\b/);
    });

    it('shows facet dropdowns at 360px in a single flex row without wrapping', async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 360 });
      renderHistory();
      await screen.findByText('Fractions');
      const facetRow = getCompactFacetGrid();
      expect(classOf(facetRow)).toMatch(/\bflex\b/);
      expect(classOf(facetRow)).not.toMatch(/\bflex-wrap\b/);
      expect(compactFacetTrigger('Subject')).toBeVisible();
      expect(compactFacetTrigger('Grade')).toBeVisible();
      expect(compactFacetTrigger('Curriculum')).toBeVisible();
      expect(compactFacetTrigger('Curriculum')).toHaveTextContent(/^Curriculum$/);
    });

    it('labels compact facet triggers in Arabic with RTL-friendly layout', async () => {
      document.documentElement.dir = 'rtl';
      renderHistory(<HistoryClient />, 'ar');
      await screen.findByText('Fractions');
      expect(within(getToolbar()).getByRole('button', { name: 'المادة' })).toBeInTheDocument();
      expect(within(getToolbar()).getByRole('button', { name: 'الصف' })).toBeInTheDocument();
      expect(within(getToolbar()).getByRole('button', { name: 'المنهج' })).toBeInTheDocument();
      document.documentElement.dir = 'ltr';
    });

    it('keeps the compact pinned toolbar in one column on a sideways phone layout', async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 844 });
      renderHistory();
      await screen.findByText('Fractions');
      const layout = within(getToolbar()).getByTestId('history-toolbar-compact-layout');
      expect(classOf(layout)).toMatch(/\bflex-col\b/);
      expect(classOf(layout)).not.toMatch(/\bflex-wrap\b/);
      expect(classOf(getCompactFacetGrid())).toMatch(/\bflex\b/);
    });

    it('keeps the pinned title outside the scroller when the lesson pane scrolls', async () => {
      renderHistory();
      await screen.findByText('Fractions');
      const title = getPageTitleBlock();
      const scroller = screen.getByTestId('history-lesson-scroller');
      expect(scroller.contains(title)).toBe(false);
      Object.defineProperty(scroller, 'scrollTop', { writable: true, configurable: true, value: 320 });
      fireEvent.scroll(scroller);
      expect(scroller.contains(title)).toBe(false);
      expect(getPageTitleBlock()).toBeInTheDocument();
    });
  });
});
