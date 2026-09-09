import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('FreePeriod — AI Lesson Planner');
  });

  test('renders navbar with logo and CTAs', async ({ page }) => {
    await expect(page.getByText('FreePeriod').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get started free' })).toBeVisible();
  });

  test('hero section renders headline and CTAs', async ({ page }) => {
    const hero = page.getByRole('heading', { level: 1 });
    await expect(hero).toContainText(/lesson plans/i);
    await expect(page.getByRole('link', { name: /start for free/i })).toBeVisible();
  });

  test('features section contains all three cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /everything teachers need/i })).toBeVisible();
    // Scroll to reveal IntersectionObserver-animated cards
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(600);
    await expect(page.getByText('Structured Plans')).toBeVisible();
    await expect(page.getByText('AI-Powered')).toBeVisible();
    await expect(page.getByText('Export Anywhere')).toBeVisible();
  });

  test('CTA section is visible', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole('heading', { name: /ready to reclaim/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started for free/i })).toBeVisible();
  });

  test('footer renders with copyright', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByText('FreePeriod', { exact: true })).toBeVisible();
    await expect(footer.getByText(/2026/)).toBeVisible();
  });

  test('navbar CTAs link to correct auth routes', async ({ page }) => {
    const signInLink = page.getByRole('link', { name: 'Sign in' }).first();
    await expect(signInLink).toHaveAttribute('href', '/sign-in');
    const getStartedLink = page.getByRole('link', { name: 'Get started free' });
    await expect(getStartedLink).toHaveAttribute('href', '/sign-up');
  });

  test('locale switch keeps hero visible and updates copy', async ({ page }) => {
    const hero = page.getByRole('heading', { level: 1 });
    await expect(hero).toBeVisible();
    const initialOpacity = await hero.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(initialOpacity)).toBeGreaterThan(0);

    await page.getByRole('button', { name: /language/i }).click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveClass(/t-dropdown/);
    await expect(menu).toHaveAttribute('data-origin', 'top-right');
    await page.getByRole('menuitem', { name: 'Español' }).click();

    await expect(hero).toBeVisible();
    await expect(hero).toContainText(/Planes de clase en/i);
    const afterOpacity = await hero.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(afterOpacity)).toBeGreaterThan(0);
  });

  test('theme toggle swaps icons without hiding the control', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /switch to dark mode/i });
    await expect(toggle).toBeVisible();
    await expect(toggle.locator('.t-icon-swap')).toHaveAttribute('data-state', 'a');
    await toggle.click();
    await expect(page.getByRole('button', { name: /switch to light mode/i })).toBeVisible();
    await expect(page.locator('.t-icon-swap').first()).toHaveAttribute('data-state', 'b');
    const darkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(darkClass).toBe(true);
  });
});
