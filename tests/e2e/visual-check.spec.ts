import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.resolve(process.cwd(), 'tests/e2e/.auth/user.json');

// Ensure screenshots dir exists
const screenshotsDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('Visual checks — authenticated', () => {
  test.use({ storageState: AUTH_FILE });

  test('dashboard — ColorBends canvas exists', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/dashboard.png', fullPage: true });

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 8000 });
  });

  test('dashboard — primary CTA has btn-shine', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);

    const ctaLinks = page.locator('a.btn-shine');
    const count = await ctaLinks.count();
    console.log(`Found ${count} btn-shine links on /dashboard`);
    expect(count).toBeGreaterThan(0);
  });

  test('dashboard — btn-shine elements have required classes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('load');

    const btnShineEls = await page.$$eval('[class*="btn-shine"]', els =>
      els.map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().slice(0, 40),
        hasRelative: window.getComputedStyle(el).position === 'relative',
        hasOverflowHidden: window.getComputedStyle(el).overflow === 'hidden',
      }))
    );
    console.log('btn-shine elements:', JSON.stringify(btnShineEls, null, 2));
    expect(btnShineEls.length).toBeGreaterThan(0);
  });

  test('generate — ColorBends canvas exists', async ({ page }) => {
    await page.goto('/generate');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/generate.png', fullPage: true });

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 8000 });
  });

  test('generate — Subject dropdown opens correctly', async ({ page }) => {
    await page.goto('/generate');
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);

    const subjectTrigger = page.getByRole('combobox').first();
    await subjectTrigger.click();
    await page.waitForTimeout(400);

    await page.screenshot({ path: 'screenshots/generate-subject-dropdown.png' });

    const dropdownContent = page.locator('[data-radix-popper-content-wrapper], [role="listbox"]').first();
    await expect(dropdownContent).toBeVisible({ timeout: 5000 });
  });

  test('generate — submit button has btn-shine', async ({ page }) => {
    await page.goto('/generate');
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);

    const submitBtn = page.getByRole('button', { name: /generate lesson plan/i });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    const classes = await submitBtn.getAttribute('class');
    console.log('Submit button classes:', classes);
    expect(classes).toContain('btn-shine');
  });

  test('generate — Grade dropdown opens correctly', async ({ page }) => {
    await page.goto('/generate');
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);

    const comboboxes = page.getByRole('combobox');
    const count = await comboboxes.count();
    console.log(`Found ${count} comboboxes on /generate`);
    expect(count).toBeGreaterThan(1);

    await comboboxes.nth(1).click();
    await page.waitForTimeout(400);

    await page.screenshot({ path: 'screenshots/generate-grade-dropdown.png' });

    const dropdownContent = page.locator('[data-radix-popper-content-wrapper], [role="listbox"]').first();
    await expect(dropdownContent).toBeVisible({ timeout: 5000 });
  });
});
