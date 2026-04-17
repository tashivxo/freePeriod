/**
 * Regression tests for the 5 bugs fixed in this sprint.
 *
 * BUG 1 — Middleware: authenticated users not redirected away from /settings
 * BUG 2 — Onboarding buttons: flex-1 layout (requires incomplete-onboarding account; tested via unit tests)
 * BUG 3 — Generate dropdowns open below trigger (side="bottom")
 * BUG 4 — UAE MOE curriculum option present in GenerateForm
 * BUG 5 — ColorBends 'use client' — canvas renders on all app pages
 */
import { test, expect, type Page } from '@playwright/test';
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
    await page.waitForLoadState('domcontentloaded');
    const settingsLink = page.getByRole('link', { name: /settings/i }).first();
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();
    // waitForURL handles navigation + any redirect chain cleanly
    await page.waitForURL(/\/settings/, { timeout: 20000 });
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
    await page.waitForLoadState('networkidle');
  });

  test('Grade dropdown opens below its trigger', async ({ page }) => {
    const gradeTrigger = page.getByRole('combobox', { name: /grade/i });
    await expect(gradeTrigger).toBeVisible();
    const triggerBox = await gradeTrigger.boundingBox();
    expect(triggerBox).not.toBeNull();

    await gradeTrigger.click();
    await page.waitForTimeout(300);

    const contentWrapper = page.locator('[data-radix-popper-content-wrapper]').first();
    await expect(contentWrapper).toBeVisible({ timeout: 5000 });
    // Use evaluate() to get bounding rect — avoids Playwright/Radix popper boundingBox() stall
    const contentBox = await contentWrapper.evaluate((el) => el.getBoundingClientRect());

    // Content top must be at or below trigger bottom (opens downward, not upward)
    expect(contentBox.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 5);

    await page.keyboard.press('Escape');
  });

  test('Duration dropdown opens below its trigger', async ({ page }) => {
    const durationTrigger = page.getByRole('combobox', { name: /duration/i });
    await expect(durationTrigger).toBeVisible();
    const triggerBox = await durationTrigger.boundingBox();
    expect(triggerBox).not.toBeNull();

    await durationTrigger.click();
    await page.waitForTimeout(300);

    const contentWrapper = page.locator('[data-radix-popper-content-wrapper]').first();
    await expect(contentWrapper).toBeVisible({ timeout: 5000 });
    const contentBox = await contentWrapper.evaluate((el) => el.getBoundingClientRect());

    expect(contentBox.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 5);

    await page.keyboard.press('Escape');
  });

  test('Curriculum dropdown opens below its trigger', async ({ page }) => {
    // Use ID to avoid strict mode violation — file upload input also has 'curriculum' aria-label
    const curriculumTrigger = page.locator('#curriculum-select');
    await expect(curriculumTrigger).toBeVisible();
    const triggerBox = await curriculumTrigger.boundingBox();
    expect(triggerBox).not.toBeNull();

    await curriculumTrigger.click();
    await page.waitForTimeout(300);

    const contentWrapper = page.locator('[data-radix-popper-content-wrapper]').first();
    await expect(contentWrapper).toBeVisible({ timeout: 5000 });
    const contentBox = await contentWrapper.evaluate((el) => el.getBoundingClientRect());

    expect(contentBox.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 5);

    await page.keyboard.press('Escape');
  });
});

// ---------------------------------------------------------------------------
// BUG 4 — UAE MOE curriculum option present in GenerateForm dropdown
// ---------------------------------------------------------------------------
test.describe('BUG 4 — UAE MOE curriculum option present', () => {
  test('UAE MOE is listed in the Generate form curriculum dropdown', async ({ page }) => {
    await page.goto('/generate');
    await page.waitForLoadState('networkidle');

    // Target the curriculum combobox directly by ID — avoids iterating all comboboxes
    const curriculumTrigger = page.locator('#curriculum-select');
    await expect(curriculumTrigger).toBeVisible();
    await curriculumTrigger.click();

    const uaeOption = page.getByRole('option', { name: 'UAE MOE' });
    await expect(uaeOption).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');
  });
});

// ---------------------------------------------------------------------------
// BUG 5 — ColorBends WebGL canvas renders on all app pages
//
// Three assertions per page to prove the animation is actually rendering:
//   1. Canvas element is present in the DOM
//   2. Canvas has real viewport-scale dimensions (not a 1×1 ghost element)
//   3. At least one pixel in the WebGL drawing buffer has non-zero alpha
//      (proves the shader ran and wrote colour, not just that a <canvas> tag exists)
// ---------------------------------------------------------------------------

/** Read the centre pixel from a WebGL canvas and return whether alpha > 0. */
async function canvasHasVisiblePixels(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return false;
    try {
      const gl = (
        canvas.getContext('webgl2') ?? canvas.getContext('webgl')
      ) as WebGLRenderingContext | null;
      if (!gl) return false;
      const pixels = new Uint8Array(4);
      gl.readPixels(
        Math.floor(gl.drawingBufferWidth / 2),
        Math.floor(gl.drawingBufferHeight / 2),
        1, 1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels,
      );
      // pixels[3] is the alpha channel — > 0 means the shader wrote a pixel here
      return pixels[3] > 0;
    } catch {
      return false;
    }
  });
}

test.describe('BUG 5 — ColorBends WebGL canvas renders on all app pages', () => {
  test('canvas renders with dimensions and visible pixels on /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Allow Three.js to initialise and paint several frames
    await page.waitForTimeout(3000);

    // 1. Canvas is present in the DOM
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeAttached({ timeout: 8000 });

    // 2. Canvas has real viewport-scale dimensions (not a 1×1 ghost)
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);

    // 3. WebGL drawing buffer contains at least one non-transparent pixel
    const hasPixels = await canvasHasVisiblePixels(page);
    expect(hasPixels).toBe(true);
  });

  test('canvas renders with dimensions and visible pixels on /generate', async ({ page }) => {
    await page.goto('/generate');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 1. Canvas is present in the DOM
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeAttached({ timeout: 8000 });

    // 2. Canvas has real viewport-scale dimensions (not a 1×1 ghost)
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);

    // 3. WebGL drawing buffer contains at least one non-transparent pixel
    const hasPixels = await canvasHasVisiblePixels(page);
    expect(hasPixels).toBe(true);
  });

  test('canvas renders with dimensions and visible pixels on /history', async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 1. Canvas is present in the DOM
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeAttached({ timeout: 8000 });

    // 2. Canvas has real viewport-scale dimensions (not a 1×1 ghost)
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);

    // 3. WebGL drawing buffer contains at least one non-transparent pixel
    const hasPixels = await canvasHasVisiblePixels(page);
    expect(hasPixels).toBe(true);
  });
});
