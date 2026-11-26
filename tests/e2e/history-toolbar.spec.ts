import { test, expect, type Locator, type Page } from '@playwright/test';

test.use({ storageState: 'tests/e2e/.auth/user.json' });

function rectsIntersect(
  a: { top: number; left: number; right: number; bottom: number },
  b: { top: number; left: number; right: number; bottom: number },
) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

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
  const toolbar = page.getByTestId('history-toolbar');
  const [toolbarBox, targetBox] = await Promise.all([
    toolbar.boundingBox(),
    target.boundingBox(),
  ]);
  if (!toolbarBox || !targetBox) return false;
  return rectsIntersect(toolbarBox, targetBox);
}

test.describe('History toolbar layout at 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('pins only the search toolbar under the nav', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('history-page-title-mobile')).toBeVisible();

    await expect(page.getByTestId('history-toolbar')).toHaveCount(1);
    const toolbar = page.getByTestId('history-toolbar');
    const toolbarRow = page.getByTestId('history-mobile-toolbar-row');
    const title = page.getByTestId('history-page-title-mobile');
    const scroller = page.getByTestId('history-lesson-scroller');
    await expect(toolbar).toBeVisible();
    await expect(toolbarRow).toBeVisible();

    const toolbarStyle = await toolbar.evaluate((el) => {
      const style = getComputedStyle(el);
      return { position: style.position, top: style.top };
    });
    expect(toolbarStyle.position).not.toBe('sticky');

    const navBottom = await getNavBottom(page);
    const toolbarRowTop = await toolbarRow.evaluate((el) => el.getBoundingClientRect().top);
    if (navBottom != null) {
      expect(Math.abs(toolbarRowTop - navBottom)).toBeLessThanOrEqual(2);
    }

    const toolbarRowBottom = await toolbarRow.evaluate((el) => el.getBoundingClientRect().bottom);
    const scrollerTop = await scroller.evaluate((el) => el.getBoundingClientRect().top);
    expect(scrollerTop).toBeGreaterThanOrEqual(toolbarRowBottom - 1);

    const titlePosition = await title.evaluate((el) => getComputedStyle(el).position);
    expect(titlePosition).not.toBe('sticky');

    const toolbarHeight = await toolbar.evaluate((el) => el.getBoundingClientRect().height);
    expect(toolbarHeight).toBeLessThanOrEqual(88);

    expect(await intersectsToolbar(page, title)).toBe(false);
    const firstCard = page.locator('[data-testid="history-lesson-scroller"] a').first();
    await expect(firstCard).toBeVisible();
    expect(await intersectsToolbar(page, firstCard)).toBe(false);

    const canScrollPane = await scroller.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    );
    expect(canScrollPane).toBe(true);

    const titleBefore = await title.evaluate((el) => el.getBoundingClientRect().top);
    await scroller.evaluate((el) => {
      el.scrollTop = 400;
    });
    await page.waitForTimeout(100);
    await expect(toolbar).toBeInViewport();
    const titleAfter = await title.evaluate((el) => el.getBoundingClientRect().top);
    expect(titleAfter).toBeLessThan(titleBefore);
    await expect(page.getByRole('textbox', { name: /search lessons by title/i })).toBeVisible();
    expect(await intersectsToolbar(page, firstCard)).toBe(false);
    expect(await intersectsToolbar(page, title)).toBe(false);

    await expect(page.getByRole('button', { name: /^Filters$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /all subjects/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /all grades/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /all curricula/i })).toHaveCount(0);
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
  });
});

test.describe('History toolbar layout at 1440x900', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('keeps the title, Plan Lesson, and search in the sticky header', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('history-page-title-desktop')).toBeVisible();
    await expect(page.getByTestId('history-toolbar')).toHaveCount(1);

    const titleBlock = page.getByTestId('history-page-title-desktop');
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
    await expect(toolbar).toContainText(/search/i);
    await expect(page.getByRole('button', { name: /^Filters$/ })).toHaveCount(0);
    await expect(page.getByTestId('history-filter-chips')).toHaveCount(0);

    await expect(page.getByRole('button', { name: /all subjects/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /all grades/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /all curricula/i })).toBeVisible();
    await expect(toolbar.locator('[aria-haspopup="listbox"]').first()).toBeVisible();
  });
});