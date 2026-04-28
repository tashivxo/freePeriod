import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page) {
  await page.context().clearCookies();
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill('testteacher@mailinator.com');
  await page.getByLabel('Password').fill('TestPass123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

test.describe('generate page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/generate');
  });

  test('renders lesson form heading', async ({ page }) => {
    // Matches "Create Lesson Plan" (old) and "Generate a Lesson" (new)
    await expect(
      page.getByRole('heading').filter({ hasText: /lesson/i }).first(),
    ).toBeVisible();
  });

  test('subject label is visible', async ({ page }) => {
    await expect(page.getByText('Subject', { exact: true })).toBeVisible();
  });

  test('grade label is visible', async ({ page }) => {
    // Matches "Grade" (new) and "Grade / Year Group" (old)
    await expect(page.locator('label').filter({ hasText: /grade/i }).first()).toBeVisible();
  });

  test('generate submit button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /generate/i })).toBeVisible();
  });
});
