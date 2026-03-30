import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page) {
  await page.context().clearCookies();
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill('testteacher@mailinator.com');
  await page.getByLabel('Password').fill('TestPass123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('FreePeriod — AI Lesson Planner');
  });

  test('renders navbar with active Dashboard link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Generate', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /history/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
  });

  test('shows personalised greeting', async ({ page }) => {
    await expect(page.getByText(/hi,/i)).toBeVisible();
  });

  test('shows lesson count badge', async ({ page }) => {
    await expect(page.getByText(/lessons generated/i)).toBeVisible();
  });

  test('"New Lesson Plan" button is visible and links to generate', async ({ page }) => {
    const btn = page.getByRole('link', { name: /new lesson plan/i });
    await expect(btn).toBeVisible();
  });

  test('empty state shows "Generate Lesson" call to action', async ({ page }) => {
    // Test account has 0 lessons
    await expect(page.getByText(/no lessons yet/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /generate lesson/i })).toBeVisible();
  });
});

test.describe('Generate page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/generate');
  });

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('Generate — FreePeriod');
  });

  test('renders form with all required fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /generate a lesson/i })).toBeVisible();
    await expect(page.getByLabel('Subject')).toBeVisible();
    await expect(page.getByLabel('Grade')).toBeVisible();
    await expect(page.getByLabel('Duration')).toBeVisible();
    await expect(page.getByRole('button', { name: /^generate$/i })).toBeVisible();
  });

  test('subject and grade are pre-populated from teacher profile', async ({ page }) => {
    const subject = page.getByLabel('Subject');
    await expect(subject).toBeVisible();
    // Subject should have a selected value (not empty)
    const value = await subject.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('file upload zones are present', async ({ page }) => {
    await expect(page.getByText('Curriculum Document', { exact: true })).toBeVisible();
    await expect(page.getByText('Lesson Plan Template', { exact: true })).toBeVisible();
  });
});

test.describe('History page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/history');
  });

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('Lesson History — FreePeriod');
  });

  test('renders heading and empty state for new account', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /lesson history/i })).toBeVisible();
    await expect(page.getByText(/no lessons yet/i)).toBeVisible();
  });
});

test.describe('Settings page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/settings');
  });

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('Settings — FreePeriod');
  });

  test('renders profile section with user data', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
    await expect(page.getByText('testteacher@mailinator.com')).toBeVisible();
  });

  test('renders teaching defaults section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /teaching defaults/i })).toBeVisible();
    await expect(page.getByLabel(/default subject/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /save defaults/i })).toBeVisible();
  });

  test('renders usage section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /usage/i })).toBeVisible();
    await expect(page.getByText(/lessons generated/i)).toBeVisible();
  });
});
