/**
 * Regression tests for the 5 bugs fixed in this sprint.
 *
 * BUG 1 — Middleware: authenticated users not redirected away from /settings
 * BUG 2 — Onboarding buttons: flex-1 layout (requires incomplete-onboarding account; tested via unit tests)
 * BUG 3 — Generate dropdowns open below trigger (side="bottom")
 * BUG 4 — UAE MOE curriculum option present in GenerateForm
 * BUG 5 — ColorBends 'use client' — canvas renders on all app pages
 */
import { test, expect } from '@playwright/test';
import path from 'path';

// Reuse the auth state saved by globalSetup — avoids repeated sign-in on every test
// and eliminates timeout failures caused by parallel workers all signing in simultaneously.
const AUTH_FILE = path.join(process.cwd(), 'tests/e2e/.auth/user.json');
test.use({ storageState: AUTH_FILE });

// ---------------------------------------------------------------------------
// BUG 1 — Middleware: /settings is not blocked or redirected for logged-in users
// ---------------------------------------------------------------------------
test.describe('BUG 1 — Settings accessible from navbar and by direct URL', () => {
  test('Settings navbar link navigates to /settings', async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for the page (and navbar) to fully settle before interacting
    await page.waitForLoadState('networkidle');
    const settingsLink = page.getByRole('link', { name: /settings/i }).first();
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  });

  test('/settings direct navigation does not redirect away', async ({ page }) => {
    await page.goto('/settings');
    // Must stay on /settings — not redirected to /onboarding or /sign-in
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// BUG 3 — Generate form dropdowns open below their trigger (not above)
// ---------------------------------------------------------------------------
test.describe('BUG 3 — Generate form dropdowns open below trigger', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/generate');
    await page.waitForLoadState('load');
    await page.waitForTimeout(600);
  });

  test('Grade dropdown opens below its trigger', async ({ page }) => {
    const gradeTrigger = page.getByLabel('Grade');
    const triggerBox = await gradeTrigger.boundingBox();
    expect(triggerBox).not.toBeNull();

    await gradeTrigger.click();
    await page.waitForTimeout(300);

    const contentWrapper = page.locator('[data-radix-popper-content-wrapper]').first();
    await expect(contentWrapper).toBeVisible({ timeout: 5000 });
    const contentBox = await contentWrapper.boundingBox();
    expect(contentBox).not.toBeNull();

    // Content top must be at or below trigger bottom (opens downward, not upward)
    expect(contentBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 5);

    await page.keyboard.press('Escape');
  });

  test('Duration dropdown opens below its trigger', async ({ page }) => {
    const durationTrigger = page.getByLabel('Duration');
    const triggerBox = await durationTrigger.boundingBox();
    expect(triggerBox).not.toBeNull();

    await durationTrigger.click();
    await page.waitForTimeout(300);

    const contentWrapper = page.locator('[data-radix-popper-content-wrapper]').first();
    await expect(contentWrapper).toBeVisible({ timeout: 5000 });
    const contentBox = await contentWrapper.boundingBox();
    expect(contentBox).not.toBeNull();

    expect(contentBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 5);

    await page.keyboard.press('Escape');
  });

  test('Curriculum dropdown opens below its trigger', async ({ page }) => {
    const curriculumTrigger = page.getByLabel('Curriculum');
    const triggerBox = await curriculumTrigger.boundingBox();
    expect(triggerBox).not.toBeNull();

    await curriculumTrigger.click();
    await page.waitForTimeout(300);

    const contentWrapper = page.locator('[data-radix-popper-content-wrapper]').first();
    await expect(contentWrapper).toBeVisible({ timeout: 5000 });
    const contentBox = await contentWrapper.boundingBox();
    expect(contentBox).not.toBeNull();

    expect(contentBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 5);

    await page.keyboard.press('Escape');
  });
});

// ---------------------------------------------------------------------------
// BUG 4 — UAE MOE curriculum option present in GenerateForm dropdown
// ---------------------------------------------------------------------------
test.describe('BUG 4 — UAE MOE curriculum option present', () => {
  test('UAE MOE is listed in the Generate form curriculum dropdown', async ({ page }) => {
    await page.goto('/generate');
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);

    // Open each combobox until we find the one containing UAE MOE
    let found = false;
    const comboboxCount = await page.getByRole('combobox').count();

    for (let i = 0; i < comboboxCount; i++) {
      await page.getByRole('combobox').nth(i).click();
      await page.waitForTimeout(250);

      const uaeOption = page.getByRole('option', { name: 'UAE MOE' });
      if (await uaeOption.count() > 0 && await uaeOption.isVisible()) {
        found = true;
        await page.keyboard.press('Escape');
        break;
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
    }

    expect(found).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// BUG 5 — ColorBends canvas renders on all app pages after 'use client' fix
// ---------------------------------------------------------------------------
test.describe('BUG 5 — ColorBends WebGL canvas renders on all app pages', () => {
  test('canvas element is visible on /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 8000 });
  });

  test('canvas element is visible on /generate', async ({ page }) => {
    await page.goto('/generate');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 8000 });
  });

  test('canvas element is visible on /history', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 8000 });
  });
});
