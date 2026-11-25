import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/e2e/.auth/user.json' });

test.describe('History toolbar layout at 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('pins only the search toolbar under the nav', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /lesson plan history/i })).toBeVisible();

    const toolbar = page.getByTestId('history-toolbar');
    const title = page.getByTestId('history-page-title');
    await expect(toolbar).toBeVisible();

    const toolbarStyle = await toolbar.evaluate((el) => {
      const style = getComputedStyle(el);
      return { position: style.position, top: style.top };
    });
    expect(toolbarStyle.position).toBe('sticky');
    const topPx = parseFloat(toolbarStyle.top);
    expect(topPx).toBeGreaterThanOrEqual(48);
    expect(topPx).toBeLessThanOrEqual(64);

    const titlePosition = await title.evaluate((el) => getComputedStyle(el).position);
    expect(titlePosition).not.toBe('sticky');

    const toolbarHeight = await toolbar.evaluate((el) => el.getBoundingClientRect().height);
    expect(toolbarHeight).toBeLessThanOrEqual(88);

    const canScroll = await page.evaluate(() => document.scrollHeight > window.innerHeight);
    if (canScroll) {
      const titleBefore = await title.evaluate((el) => el.getBoundingClientRect().top);
      await page.evaluate(() => window.scrollBy(0, 400));
      await expect(toolbar).toBeInViewport();
      const titleAfter = await title.evaluate((el) => el.getBoundingClientRect().top);
      expect(titleAfter).toBeLessThan(titleBefore);
      await expect(page.getByRole('textbox', { name: /search lessons by title/i })).toBeVisible();
    }

    await expect(page.getByRole('button', { name: /all subjects/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /all grades/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /all curricula/i })).toHaveCount(0);
  });
});

test.describe('History toolbar layout at 1440x900', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('keeps the title, Plan Lesson, and search in the sticky header', async ({ page }) => {
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /lesson plan history/i })).toBeVisible();

    const heading = page.getByRole('heading', { name: /lesson plan history/i });
    const planLesson = page.getByRole('link', { name: /plan lesson/i });
    const search = page.getByRole('textbox', { name: /search lessons by title/i });
    const header = page.getByTestId('history-page-header');

    const canScroll = await page.evaluate(() => document.scrollHeight > window.innerHeight);
    if (canScroll) {
      await page.evaluate(() => window.scrollBy(0, 400));
    }

    await expect(heading).toBeInViewport();
    await expect(planLesson).toBeInViewport();
    await expect(search).toBeInViewport();
    await expect(page.getByRole('button', { name: /^Filters$/ })).toHaveCount(0);
    await expect(page.getByTestId('history-filter-chips')).toHaveCount(0);

    const subject = page.getByRole('button', { name: /all subjects/i });
    if ((await subject.count()) > 0) {
      await expect(header.locator('[aria-haspopup="listbox"]').first()).toBeVisible();
    }
  });
});
