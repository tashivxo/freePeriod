import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'testteacher@mailinator.com';
const TEST_PASSWORD = 'TestPass123!';

test.describe('User journey — public pages', () => {
  test('landing page loads with hero, features, and footer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/FreePeriod/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/lesson plans/i);
    await expect(page.getByRole('link', { name: 'Start for free' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(page.getByText('Structured Plans')).toBeVisible();
    await expect(page.getByText('AI-Powered')).toBeVisible();
    await expect(page.getByText('Export Anywhere')).toBeVisible();
    await expect(page.getByText(/assessment, with consistent structure/i)).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole('navigation', { name: 'Legal and support' })).toBeVisible();
    await expect(page.getByText(/© 2026 FreePeriod/i)).toBeVisible();
  });

  test('pricing page loads with plan cards', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/Pricing/i);
    await expect(
      page.getByRole('heading', { name: 'Plans for every classroom', level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Free', level: 2, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro', level: 2, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro+', level: 2, exact: true })).toBeVisible();
  });

  test('privacy and terms pages load', async ({ page }) => {
    await page.goto('/privacy', { waitUntil: 'domcontentloaded', timeout: 240000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60000 });

    await page.goto('/terms', { waitUntil: 'domcontentloaded', timeout: 240000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60000 });
  });
});

test.describe('User journey — auth flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('sign-in page renders and links work', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByText(/saved sign-in/i)).toBeVisible();
    await expect(page.getByText(/not a permanent login/i)).toHaveCount(0);

    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/sign-up/);
  });

  test('sign in reaches dashboard without client error', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.locator('input#password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 120000 });
    await expect(page.getByText(/hi,/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('link', { name: /new lesson plan/i })).toBeVisible();

    const reactChildrenOnly = consoleErrors.filter((e) =>
      e.includes('React.Children.only'),
    );
    expect(reactChildrenOnly).toEqual([]);
  });
});

test.describe('User journey — authenticated app', () => {
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  test('dashboard, generate, history, and settings all load', async ({ page }) => {
    const routes = [
      { path: '/dashboard', heading: /hi,/i },
      { path: '/generate', heading: /generate a lesson/i },
      { path: '/history', heading: /lesson plan history/i },
      { path: '/settings', heading: /^settings$/i },
    ] as const;

    for (const route of routes) {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible({
        timeout: 30000,
      });
    }
  });

  test('navbar links navigate between app sections', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await page.getByRole('link', { name: 'Generate', exact: true }).click();
    await expect(page).toHaveURL(/\/generate/);

    await page.getByRole('link', { name: /history/i }).click();
    await expect(page).toHaveURL(/\/history/);

    await page.getByRole('link', { name: /settings/i }).click();
    await expect(page).toHaveURL(/\/settings/);

    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
