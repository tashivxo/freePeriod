import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page) {
  await page.context().clearCookies();
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill('testteacher@mailinator.com');
  await page.getByLabel('Password').fill('TestPass123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

test.describe('AnimatedDropdown — generate page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/generate');
  });

  test('subject dropdown opens and lists options', async ({ page }) => {
    const dropdowns = page.locator('[aria-haspopup="listbox"]');
    await dropdowns.first().click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option', { name: 'Mathematics' })).toBeVisible();
  });

  test('selecting an option closes dropdown and shows value', async ({ page }) => {
    const dropdowns = page.locator('[aria-haspopup="listbox"]');
    await dropdowns.first().click();
    await page.getByRole('option', { name: 'Science' }).click();
    await expect(page.getByRole('listbox')).not.toBeVisible();
    await expect(dropdowns.first()).toContainText('Science');
  });

  test('grade dropdown lists grade options', async ({ page }) => {
    const dropdowns = page.locator('[aria-haspopup="listbox"]');
    await dropdowns.nth(1).click();
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await expect(page.getByRole('option', { name: 'Grade 1' })).toBeVisible();
  });

  test('curriculum dropdown contains UAE MOE', async ({ page }) => {
    const dropdowns = page.locator('[aria-haspopup="listbox"]');
    await dropdowns.nth(2).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option', { name: 'UAE MOE' })).toBeVisible();
  });

  test('duration dropdown contains Custom option', async ({ page }) => {
    const dropdowns = page.locator('[aria-haspopup="listbox"]');
    await dropdowns.nth(3).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option', { name: 'Custom' })).toBeVisible();
  });

  test('dropdown opens below the trigger button', async ({ page }) => {
    const dropdowns = page.locator('[aria-haspopup="listbox"]');
    await dropdowns.first().click();
    const trigger = dropdowns.first();
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    const triggerBox = await trigger.boundingBox();
    const listboxBox = await listbox.boundingBox();
    expect(listboxBox!.y).toBeGreaterThan(triggerBox!.y + triggerBox!.height - 1);
  });

  test('clicking outside closes the dropdown', async ({ page }) => {
    const dropdowns = page.locator('[aria-haspopup="listbox"]');
    await dropdowns.first().click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('listbox')).not.toBeVisible();
  });
});

test.describe('AnimatedDropdown — settings page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/settings');
  });

  test('grade dropdown opens and selects a value', async ({ page }) => {
    const gradeDropdown = page.locator('#default-grade');
    await gradeDropdown.click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.getByRole('option', { name: 'Grade 10' }).click();
    await expect(page.getByRole('listbox')).not.toBeVisible();
    await expect(gradeDropdown).toContainText('Grade 10');
  });

  test('curriculum dropdown opens and contains UAE MOE', async ({ page }) => {
    const curriculumDropdown = page.locator('#default-curriculum');
    await curriculumDropdown.click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option', { name: 'UAE MOE' })).toBeVisible();
  });

  test('selecting UAE MOE closes dropdown and shows value', async ({ page }) => {
    const curriculumDropdown = page.locator('#default-curriculum');
    await curriculumDropdown.click();
    await page.getByRole('option', { name: 'UAE MOE' }).click();
    await expect(page.getByRole('listbox')).not.toBeVisible();
    await expect(curriculumDropdown).toContainText('UAE MOE');
  });

  test('selecting Custom curriculum reveals text input', async ({ page }) => {
    const curriculumDropdown = page.locator('#default-curriculum');
    await curriculumDropdown.click();
    await page.getByRole('option', { name: 'Custom' }).click();
    await expect(page.getByLabel('Enter curriculum')).toBeVisible();
  });
});

