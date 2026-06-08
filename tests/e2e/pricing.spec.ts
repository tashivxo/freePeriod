import { test, expect } from '@playwright/test';

test.describe('Pricing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
    // Allow anime.js entrance animations to complete
    await page.waitForTimeout(1200);
  });

  // ── Page metadata ───────────────────────────────────────────────
  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('Pricing — FreePeriod');
  });

  // ── Hero section ─────────────────────────────────────────────────
  test('renders hero heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Plans for every classroom', level: 1 }),
    ).toBeVisible();
  });

  test('renders hero subheading', async ({ page }) => {
    await expect(
      page.getByText(/Start free, upgrade when you're ready/i),
    ).toBeVisible();
  });

  test('renders public header with Logo and nav links', async ({ page }) => {
    const header = page.getByRole('banner');
    // Logo or "FreePeriod" brand text
    await expect(header.getByText('FreePeriod').first()).toBeVisible();
    await expect(header.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  // ── Plan cards ───────────────────────────────────────────────────
  test('renders all three pricing plan cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Free', level: 2, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro', level: 2, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro+', level: 2, exact: true })).toBeVisible();
  });

  test('Pro card has "Most Popular" badge', async ({ page }) => {
    await expect(page.getByText('Most Popular')).toBeVisible();
  });

  test('free card shows $0 price as "Free"', async ({ page }) => {
    // Free plan card should show the word "Free" as the price
    const freeCard = page.locator('[data-card]').first();
    await expect(freeCard.getByText('Free').first()).toBeVisible();
  });

  test('pro card shows $9/mo on monthly billing', async ({ page }) => {
    // Ensure monthly is active (default)
    await expect(page.getByRole('button', { name: 'Monthly' })).toBeVisible();
    // Pro plan price
    const proCard = page.locator('[data-card]').nth(1);
    await expect(proCard.getByText('$9')).toBeVisible();
    await expect(proCard.getByText('/mo')).toBeVisible();
  });

  test('pro_plus card shows $12/mo on monthly billing', async ({ page }) => {
    const plusCard = page.locator('[data-card]').nth(2);
    await expect(plusCard.getByText('$12')).toBeVisible();
  });

  // ── Billing toggle ───────────────────────────────────────────────
  test('billing toggle switches between Monthly and Annual', async ({ page }) => {
    // Default: Monthly active
    const monthlyBtn = page.getByRole('button', { name: 'Monthly' });
    // Annual button uses role="switch"
    const annualBtn = page.getByRole('switch');
    await expect(monthlyBtn).toBeVisible();
    await expect(annualBtn).toBeVisible();

    // Switch to Annual
    await annualBtn.click();

    // Annual button should now be active (has bg-coral class)
    await expect(annualBtn).toHaveClass(/bg-coral/);
  });

  test('"Save 20%" badge is visible on Annual button', async ({ page }) => {
    await expect(page.getByText('Save 20%')).toBeVisible();
  });

  test('switching to Annual updates Pro price to $7', async ({ page }) => {
    await page.getByRole('switch').click();
    await page.waitForTimeout(100);

    const proCard = page.locator('[data-card]').nth(1);
    await expect(proCard.getByText('$7')).toBeVisible();
  });

  test('switching to Annual updates Pro+ price to $10', async ({ page }) => {
    await page.getByRole('switch').click();
    await page.waitForTimeout(100);

    const plusCard = page.locator('[data-card]').nth(2);
    await expect(plusCard.getByText('$10')).toBeVisible();
  });

  test('annual billing shows "Billed as $X/yr" text', async ({ page }) => {
    await page.getByRole('switch').click();
    await page.waitForTimeout(100);

    // Pro: $7 * 12 = $84/yr
    await expect(page.getByText('Billed as $84/yr')).toBeVisible();
    // Pro+: $10 * 12 = $120/yr
    await expect(page.getByText('Billed as $120/yr')).toBeVisible();
  });

  // ── CTA buttons ───────────────────────────────────────────────────
  test('"Get started free" is a link to /sign-up', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Get started free' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/sign-up');
  });

  test('"Start Pro" while unauthenticated redirects to /sign-up?plan=pro', async ({
    page,
  }) => {
    const proCard = page.locator('[data-card]').nth(1);
    const startProBtn = proCard.getByRole('button', { name: 'Start Pro' });
    await expect(startProBtn).toBeVisible();

    // Click and expect navigation to sign-up with plan param
    await startProBtn.click();
    await page.waitForURL(/\/sign-up\?plan=pro/, { timeout: 8000 });
    expect(page.url()).toContain('/sign-up?plan=pro');
  });

  test('"Start Pro+" while unauthenticated redirects to /sign-up?plan=pro_plus', async ({
    page,
  }) => {
    const plusCard = page.locator('[data-card]').nth(2);
    const startPlusBtn = plusCard.getByRole('button', { name: 'Start Pro+' });
    await expect(startPlusBtn).toBeVisible();

    await startPlusBtn.click();
    await page.waitForURL(/\/sign-up\?plan=pro_plus/, { timeout: 8000 });
    expect(page.url()).toContain('/sign-up?plan=pro_plus');
  });

  // ── Features lists ───────────────────────────────────────────────
  test('Free plan features are listed', async ({ page }) => {
    await expect(page.getByText('3 lesson plans per month')).toBeVisible();
    await expect(page.getByText('DOCX export')).toBeVisible();
  });

  test('Pro plan features are listed', async ({ page }) => {
    await expect(page.getByText('Unlimited lesson plans')).toBeVisible();
    await expect(page.getByText('OCR text extraction')).toBeVisible();
  });

  test('Pro+ plan features are listed', async ({ page }) => {
    await expect(page.getByText('Filled-in template download')).toBeVisible();
    await expect(page.getByText('API access')).toBeVisible();
  });

  // ── Trust footer ─────────────────────────────────────────────────
  test('trust footer text is visible', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(
      page.getByText(/30-day free trial.*cancel anytime/i),
    ).toBeVisible();
  });

  // ── Accessibility ─────────────────────────────────────────────────
  test('Annual toggle button has role="switch"', async ({ page }) => {
    const annualBtn = page.getByRole('switch');
    await expect(annualBtn).toBeVisible();
    // Default: switch is off
    await expect(annualBtn).toHaveAttribute('aria-checked', 'false');
    // After click: switch is on
    await annualBtn.click();
    await expect(annualBtn).toHaveAttribute('aria-checked', 'true');
  });

  test('all CTAs meet minimum 44px touch target height', async ({ page }) => {
    const ctaSelectors = [
      page.getByRole('link', { name: 'Get started free' }),
      page.getByRole('button', { name: 'Start Pro', exact: true }),
      page.getByRole('button', { name: 'Start Pro+', exact: true }),
    ];

    for (const cta of ctaSelectors) {
      const box = await cta.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

// ── Colour scheme accessibility ───────────────────────────────────
test.describe('Pricing page – colour scheme accessibility', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test.describe(`${scheme} mode`, () => {
      test.use({ colorScheme: scheme });

      test.beforeEach(async ({ page }) => {
        await page.goto('/pricing');
        await page.waitForTimeout(1200);
      });

      test(`Pro+ CTA uses mustard background in ${scheme} mode`, async ({ page }) => {
        const plusCard = page.locator('[data-card]').nth(2);
        const btn = plusCard.getByRole('button', { name: 'Start Pro+' });
        await expect(btn).toBeVisible();
        // Must use the fixed mustard colour — never the theme-adaptive text-primary
        await expect(btn).toHaveClass(/bg-mustard/);
        await expect(btn).not.toHaveClass(/bg-text-primary/);
      });

      test(`floating theme toggle is present in ${scheme} mode`, async ({ page }) => {
        const label =
          scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
        const toggle = page.getByRole('button', { name: label });
        await expect(toggle).toBeVisible();
        // 'fixed' lives on the wrapper div, not the button (fixed+relative on same element
        // causes relative to win in Tailwind). Verify wrapper has the fixed class instead.
        const wrapper = toggle.locator('..');
        await expect(wrapper).toHaveClass(/fixed/);
      });

      test(`page heading is visible in ${scheme} mode`, async ({ page }) => {
        await expect(
          page.getByRole('heading', { name: 'Plans for every classroom', level: 1 }),
        ).toBeVisible();
      });

      test(`trust footer is visible in ${scheme} mode`, async ({ page }) => {
        await expect(page.getByText(/30-day free trial/i)).toBeVisible();
      });
    });
  }
});

// ── Landing page integration ──────────────────────────────────────
test.describe('Landing page has Pricing link', () => {
  test('Pricing link in nav points to /pricing', async ({ page }) => {
    await page.goto('/');
    const pricingLink = page.getByRole('link', { name: 'Pricing' });
    await expect(pricingLink).toBeVisible();
    await expect(pricingLink).toHaveAttribute('href', '/pricing');
  });

  test('clicking Pricing nav link navigates to /pricing page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Pricing' }).click();
    await page.waitForURL('**/pricing', { timeout: 8000 });
    await expect(
      page.getByRole('heading', { name: 'Plans for every classroom', level: 1 }),
    ).toBeVisible();
  });
});
