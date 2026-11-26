import { test, expect, type Locator, type Page } from '@playwright/test';

test.use({ storageState: 'tests/e2e/.auth/user.json' });

const LOCALE_FACETS = {
  en: ['Subject', 'Grade', 'Curriculum'] as const,
  ar: ['المادة', 'الصف', 'المنهج'] as const,
  es: ['Materia', 'Grado', 'Currículo'] as const,
  fr: ['Matière', 'Niveau', 'Programme'] as const,
  'zh-Hans': ['学科', '年级', '课程'] as const,
} as const;

type LocaleKey = keyof typeof LOCALE_FACETS;

async function getNavBottom(page: Page) {
  return page.evaluate(() => {
    const nav =
      document.querySelector('header') ??
      document.querySelector('[data-testid="app-nav"]') ??
      document.querySelector('nav');
    if (!nav) return null;
    return nav.getBoundingClientRect().bottom;
  });
}

async function intersectsToolbar(page: Page, target: Locator) {
  return page.evaluate(
    ([t]) => {
      const tb = document.querySelector('[data-testid="history-toolbar"]')!.getBoundingClientRect();
      const pane = document.querySelector('[data-testid="history-lesson-scroller"]')!.getBoundingClientRect();
      const r = (t as Element).getBoundingClientRect();
      const inPane = (t as Element).closest('[data-testid="history-lesson-scroller"]');
      const top = inPane ? Math.max(r.top, pane.top) : r.top;
      const bottom = inPane ? Math.min(r.bottom, pane.bottom) : r.bottom;
      if (bottom <= top) return false;
      return !(r.right <= tb.left || r.left >= tb.right || bottom <= tb.top || top >= tb.bottom);
    },
    [await target.elementHandle()],
  );
}

async function readPinnedChromeTops(page: Page) {
  return page.evaluate(() => {
    const title = document.querySelector('[data-testid="history-page-title"]')!.getBoundingClientRect();
    const search = document
      .querySelector('[data-testid="history-toolbar"] input')!
      .getBoundingClientRect();
    const triggers = Array.from(
      document.querySelectorAll(
        '[data-testid="history-facet-grid"] button[aria-haspopup="listbox"]',
      ),
    );
    let facetsTop = Number.POSITIVE_INFINITY;
    let facetsBottom = Number.NEGATIVE_INFINITY;
    for (const el of triggers) {
      const r = el.getBoundingClientRect();
      facetsTop = Math.min(facetsTop, r.top);
      facetsBottom = Math.max(facetsBottom, r.bottom);
    }
    const facets = { top: facetsTop, bottom: facetsBottom };
    const scroller = document.querySelector('[data-testid="history-lesson-scroller"]')!.getBoundingClientRect();
    return { title, search, facets, scrollerTop: scroller.top };
  });
}

async function expectPinnedChromeOrder(page: Page) {
  const viewport = page.viewportSize();
  const isLgPlus = (viewport?.width ?? 0) >= 1024;
  const { title, search, facets, scrollerTop } = await readPinnedChromeTops(page);

  expect(title.bottom).toBeLessThanOrEqual(search.top + 1);
  expect(title.bottom).toBeLessThanOrEqual(facets.top + 1);

  if (isLgPlus) {
    expect(Math.abs(search.top - facets.top)).toBeLessThanOrEqual(4);
    const toolbarBottom = Math.max(search.bottom, facets.bottom);
    expect(toolbarBottom).toBeLessThanOrEqual(scrollerTop + 1);
  } else {
    expect(search.bottom).toBeLessThanOrEqual(facets.top + 1);
    expect(facets.bottom).toBeLessThanOrEqual(scrollerTop + 1);
  }
}

async function setLocale(page: Page, locale: LocaleKey) {
  await page.goto('/history', { waitUntil: 'domcontentloaded' });
  await page.evaluate((loc) => {
    localStorage.setItem('fp-locale', loc);
    document.cookie = `fp-locale=${encodeURIComponent(loc)}; path=/; max-age=31536000; SameSite=Lax`;
  }, locale);
  await page.reload({ waitUntil: 'domcontentloaded' });
}

type FacetFitResult = {
  rowFits: boolean;
  rowScrollWidth: number;
  rowClientWidth: number;
  triggers: Array<{ height: number; labelFits: boolean; label: string }>;
};

async function measureCompactFacetRow(page: Page): Promise<FacetFitResult> {
  return page.evaluate(() => {
    const row = document.querySelector('[data-testid="history-facet-grid"]') as HTMLElement;
    const buttons = Array.from(
      row.querySelectorAll('button[aria-haspopup="listbox"]'),
    ) as HTMLButtonElement[];
    const triggers = buttons.map((btn) => {
      const label = btn.querySelector('span');
      const height = btn.getBoundingClientRect().height;
      const labelFits = label ? label.scrollWidth <= label.clientWidth + 1 : true;
      return { height, labelFits, label: label?.textContent?.trim() ?? '' };
    });
    return {
      rowFits: row.scrollWidth <= row.clientWidth + 1,
      rowScrollWidth: row.scrollWidth,
      rowClientWidth: row.clientWidth,
      triggers,
    };
  });
}

async function expectCompactFacetRowFits(page: Page, labels: readonly [string, string, string]) {
  for (const label of labels) {
    await expect(page.getByRole('button', { name: new RegExp(`^${label}$`) })).toBeVisible();
  }
  const fit = await measureCompactFacetRow(page);
  expect(fit.rowFits, `row overflow ${fit.rowScrollWidth} > ${fit.rowClientWidth}`).toBe(true);
  for (const trigger of fit.triggers) {
    expect(trigger.height).toBeGreaterThanOrEqual(44);
    expect(trigger.labelFits, `label truncated: ${trigger.label}`).toBe(true);
  }
}

test.describe('History toolbar layout at 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('pins title, search, and facets while only cards scroll', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('history-toolbar')).toHaveCount(1);
    await expect(page.getByTestId('history-page-title')).toHaveCount(1);
    const toolbar = page.getByTestId('history-toolbar');
    const toolbarRow = page.getByTestId('history-mobile-toolbar-row');
    const title = page.getByTestId('history-page-title');
    const scroller = page.getByTestId('history-lesson-scroller');
    await expect(toolbar).toBeVisible();
    await expect(toolbarRow).toBeVisible();
    await expect(title).toBeVisible();

    const toolbarStyle = await toolbar.evaluate((el) => {
      const style = getComputedStyle(el);
      return { position: style.position, top: style.top };
    });
    expect(toolbarStyle.position).not.toBe('sticky');

    const navBottom = await getNavBottom(page);
    const headerTop = await page.getByTestId('history-page-header').evaluate((el) => el.getBoundingClientRect().top);
    if (navBottom != null) {
      expect(Math.abs(headerTop - navBottom)).toBeLessThanOrEqual(2);
    }

    await expectPinnedChromeOrder(page);
    const pinnedBefore = await readPinnedChromeTops(page);

    const firstCard = page.locator('[data-testid="history-lesson-scroller"] a').first();
    await expect(firstCard).toBeVisible();
    expect(await intersectsToolbar(page, firstCard)).toBe(false);

    const canScrollPane = await scroller.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    );
    expect(canScrollPane).toBe(true);

    await scroller.evaluate((el) => {
      el.scrollTop = 400;
    });
    await page.waitForTimeout(100);
    await expect(toolbar).toBeInViewport();
    await expect(title).toBeInViewport();
    await expectPinnedChromeOrder(page);
    const pinnedAfter = await readPinnedChromeTops(page);
    expect(pinnedAfter.title.top).toBeCloseTo(pinnedBefore.title.top, 0);
    expect(pinnedAfter.search.top).toBeCloseTo(pinnedBefore.search.top, 0);
    expect(pinnedAfter.facets.top).toBeCloseTo(pinnedBefore.facets.top, 0);
    await expect(page.getByRole('textbox', { name: /search lessons by title/i })).toBeVisible();
    expect(await intersectsToolbar(page, firstCard)).toBe(false);

    await expect(page.getByRole('button', { name: /^Filters/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Subject$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Grade$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Curriculum$/ })).toBeVisible();
    await expect(page.getByTestId('history-filter-chips')).toHaveCount(0);

    const toolbarHeight = await toolbar.evaluate((el) => el.getBoundingClientRect().height);
    expect(toolbarHeight).toBeLessThanOrEqual(130);
  });

  test('keeps search focus and value after widening the viewport', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
    const search = page.getByRole('textbox', { name: /search lessons by title/i });
    await expect(search).toHaveCount(1);
    await search.click();
    await search.fill('frac');
    await expect(search).toBeFocused();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(search).toHaveValue('frac');
    await expect(search).toBeFocused();
    await expect(page.getByTestId('history-toolbar')).toHaveCount(1);
    await expectPinnedChromeOrder(page);
    const pinnedBefore = await readPinnedChromeTops(page);
    const scroller = page.getByTestId('history-lesson-scroller');
    await scroller.evaluate((el) => {
      el.scrollTop = 300;
    });
    await page.waitForTimeout(100);
    await expectPinnedChromeOrder(page);
    const pinnedAfter = await readPinnedChromeTops(page);
    expect(pinnedAfter.title.top).toBeCloseTo(pinnedBefore.title.top, 0);
    expect(pinnedAfter.search.top).toBeCloseTo(pinnedBefore.search.top, 0);
    const toolbarHeight = await page.getByTestId('history-toolbar').evaluate((el) => el.getBoundingClientRect().height);
    expect(toolbarHeight).toBeLessThanOrEqual(140);
  });
});

test.describe('History toolbar layout at 360x844', () => {
  test.use({ viewport: { width: 360, height: 844 } });

  test('shows three facet dropdowns on one row without overflow', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
    await expectCompactFacetRowFits(page, LOCALE_FACETS.en);
    const facetRow = page.getByTestId('history-facet-grid');
    const flexWrap = await facetRow.evaluate((el) => getComputedStyle(el).flexWrap);
    expect(flexWrap).not.toBe('wrap');
  });
});

for (const locale of Object.keys(LOCALE_FACETS) as LocaleKey[]) {
  const labels = LOCALE_FACETS[locale];

  test.describe(`History compact facets – ${locale}`, () => {
    test('fits unpicked labels at 390x844', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await setLocale(page, locale);
      await expectCompactFacetRowFits(page, labels);
    });

    test('fits unpicked labels at 360x740', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await setLocale(page, locale);
      await expectCompactFacetRowFits(page, labels);
    });
  });
}

test.describe('History toolbar layout at 1440x900', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('keeps the title, Plan Lesson, and search in the sticky header', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('history-page-title')).toBeVisible();
    await expect(page.getByTestId('history-toolbar')).toHaveCount(1);

    const titleBlock = page.getByTestId('history-page-title');
    const heading = titleBlock.getByRole('heading', { name: /lesson plan history/i });
    const planLesson = titleBlock.getByRole('link', { name: /plan lesson/i });
    const search = page.getByRole('textbox', { name: /search lessons by title/i });
    const toolbar = page.getByTestId('history-toolbar');
    const scroller = page.getByTestId('history-lesson-scroller');

    const canScrollPane = await scroller.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    );
    if (canScrollPane) {
      await scroller.evaluate((el) => {
        el.scrollTop = 400;
      });
      await page.waitForTimeout(100);
    }

    await expect(heading).toBeInViewport();
    await expect(planLesson).toBeInViewport();
    await expect(search).toBeInViewport();
    await expect(page.getByPlaceholder('Search by title...')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Filters$/ })).toHaveCount(0);
    await expect(page.getByTestId('history-filter-chips')).toHaveCount(0);

    await expect(page.getByRole('button', { name: /all subjects/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /all grades/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /all curricula/i })).toBeVisible();
    await expect(toolbar.locator('[aria-haspopup="listbox"]').first()).toBeVisible();
    await expectPinnedChromeOrder(page);
  });
});