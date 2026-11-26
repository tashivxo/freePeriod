import { test, expect, type Locator, type Page } from '@playwright/test';

test.use({ storageState: 'tests/e2e/.auth/user.json' });

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
    const facets = document.querySelector('[data-testid="history-facet-grid"]')!.getBoundingClientRect();
    const scroller = document.querySelector('[data-testid="history-lesson-scroller"]')!.getBoundingClientRect();
    return { title, search, facets, scrollerTop: scroller.top };
  });
}

async function expectPinnedChromeOrder(page: Page) {
  const { title, search, facets, scrollerTop } = await readPinnedChromeTops(page);
  expect(title.bottom).toBeLessThanOrEqual(search.top + 1);
  expect(search.bottom).toBeLessThanOrEqual(facets.top + 1);
  expect(facets.bottom).toBeLessThanOrEqual(scrollerTop + 1);
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
    await expect(page.getByRole('button', { name: /^Subject$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Grade$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Curriculum$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Curriculum$/ })).toHaveText(/^Curriculum$/);
    const facetRow = page.getByTestId('history-facet-grid');
    const rowBox = await facetRow.boundingBox();
    expect(rowBox).not.toBeNull();
    expect(rowBox!.width).toBeLessThanOrEqual(360);
    const flexWrap = await facetRow.evaluate((el) => getComputedStyle(el).flexWrap);
    expect(flexWrap).not.toBe('wrap');
  });
});

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