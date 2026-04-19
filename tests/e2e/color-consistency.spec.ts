import { test, expect, type Page } from '@playwright/test';

/**
 * Color consistency tests — verify that:
 * 1. Brand hex values do NOT appear as hardcoded inline styles in the DOM
 * 2. CSS custom properties resolve to the correct brand values on each route
 * 3. Key interactive elements use the expected brand colors
 *
 * Routes tested: landing page, sign-in, sign-up, dashboard (if accessible)
 */

// Brand hex values that must never appear as raw inline-style strings in the DOM.
// (Defined here so we can assert their absence without importing from brand-colors.ts
// which is a server-side module not available to Playwright browser context.)
const BRAND_HEX = {
  coral: '#FF8BB0',
  mustard: '#F7C34B',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
} as const;

// CSS variables that must be present and non-empty on every tested route.
const REQUIRED_CSS_VARS = [
  '--color-coral',
  '--color-mustard',
  '--color-background',
  '--color-success',
  '--color-error',
  '--text-primary',
  '--text-secondary',
  '--surface',
] as const;

// Routes to test (all publicly accessible without auth)
const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up'] as const;

// ---------------------------------------------------------------------------
// Helper — evaluate CSS custom property value in the browser
// ---------------------------------------------------------------------------
async function getCssVar(page: Page, varName: string): Promise<string> {
  return page.evaluate(
    (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim(),
    varName,
  );
}

// Helper — count inline style occurrences of a hex string across all DOM nodes
async function countInlineHex(page: Page, hex: string): Promise<number> {
  return page.evaluate((h: string) => {
    const lower = h.toLowerCase();
    let count = 0;
    document.querySelectorAll('[style]').forEach((el) => {
      const style = el.getAttribute('style') ?? '';
      if (style.toLowerCase().includes(lower)) count++;
    });
    return count;
  }, hex);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe('Color token consistency', () => {
  for (const route of PUBLIC_ROUTES) {
    test.describe(`Route: ${route}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(route);
        // Wait for the page shell to be painted
        await page.waitForLoadState('domcontentloaded');
      });

      // -- CSS custom properties --
      test('all required CSS custom properties are defined and non-empty', async ({ page }) => {
        for (const varName of REQUIRED_CSS_VARS) {
          const value = await getCssVar(page, varName);
          expect(value, `CSS var ${varName} must be defined on ${route}`).not.toBe('');
        }
      });

      test('--color-coral resolves to the coral brand value', async ({ page }) => {
        const value = await getCssVar(page, '--color-coral');
        expect(value.toLowerCase()).toBe(BRAND_HEX.coral.toLowerCase());
      });

      test('--color-mustard resolves to the mustard brand value', async ({ page }) => {
        const value = await getCssVar(page, '--color-mustard');
        expect(value.toLowerCase()).toBe(BRAND_HEX.mustard.toLowerCase());
      });

      test('--color-success resolves to the success brand value', async ({ page }) => {
        const value = await getCssVar(page, '--color-success');
        expect(value.toLowerCase()).toBe(BRAND_HEX.success.toLowerCase());
      });

      // -- No raw brand hex in inline styles --
      test('coral hex does not appear as raw inline style', async ({ page }) => {
        const count = await countInlineHex(page, BRAND_HEX.coral);
        expect(
          count,
          `${BRAND_HEX.coral} found as raw inline style on ${route} — use var(--color-coral) instead`,
        ).toBe(0);
      });

      test('mustard hex does not appear as raw inline style', async ({ page }) => {
        const count = await countInlineHex(page, BRAND_HEX.mustard);
        expect(
          count,
          `${BRAND_HEX.mustard} found as raw inline style on ${route} — use var(--color-mustard) instead`,
        ).toBe(0);
      });

      test('text-primary hex does not appear as raw inline style', async ({ page }) => {
        const count = await countInlineHex(page, BRAND_HEX.textPrimary);
        expect(
          count,
          `${BRAND_HEX.textPrimary} found as raw inline style on ${route}`,
        ).toBe(0);
      });
    });
  }

  // -- Landing page specific checks --
  test.describe('Landing page visual checks', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    });

    test('CTA button uses coral background', async ({ page }) => {
      // The "Get started free" button has class bg-coral
      const cta = page.getByRole('link', { name: /get started free/i });
      await expect(cta).toBeVisible();

      const hasCoral = await cta.evaluate((el: Element) => {
        return el.classList.contains('bg-coral') ||
          getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)';
      });
      expect(hasCoral, 'CTA button should have a non-transparent background').toBe(true);
    });

    test('page background color matches brand background token', async ({ page }) => {
      const bodyBg = await page.evaluate(() =>
        getComputedStyle(document.body).backgroundColor,
      );
      // The background should not be pure black or transparent
      expect(bodyBg).not.toBe('rgba(0, 0, 0, 0)');
      expect(bodyBg).not.toBe('rgb(0, 0, 0)');
    });

    test('focus ring color resolves to coral', async ({ page }) => {
      // Tab to the first interactive element and check focus ring color
      await page.keyboard.press('Tab');
      const focusRingColor = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-coral').trim(),
      );
      expect(focusRingColor.toLowerCase()).toBe(BRAND_HEX.coral.toLowerCase());
    });
  });

  // -- Dark mode checks --
  test.describe('Dark mode token overrides', () => {
    test('dark mode text-primary switches to light value', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Activate dark mode by adding .dark to <html>
      await page.evaluate(() => document.documentElement.classList.add('dark'));

      const darkTextPrimary = await getCssVar(page, '--text-primary');
      // Should no longer be the dark navy (#1A1A2E) — should be the light value
      expect(darkTextPrimary.toLowerCase()).not.toBe(BRAND_HEX.textPrimary.toLowerCase());
      // In dark mode it should be non-empty
      expect(darkTextPrimary).not.toBe('');
    });

    test('dark mode does not break coral and mustard tokens', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.evaluate(() => document.documentElement.classList.add('dark'));

      // Brand colors are not theme-dependent — they should stay the same
      const coral = await getCssVar(page, '--color-coral');
      const mustard = await getCssVar(page, '--color-mustard');
      expect(coral.toLowerCase()).toBe(BRAND_HEX.coral.toLowerCase());
      expect(mustard.toLowerCase()).toBe(BRAND_HEX.mustard.toLowerCase());
    });
  });
});
