import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { getMessages } from '../../lib/i18n';

const fr = getMessages('fr');

function planCard(page: Page, name: string) {
  return page
    .getByRole('heading', { name, level: 2, exact: true })
    .locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');
}

async function clearLocaleStorage(page: Page, context: BrowserContext) {
  await context.clearCookies();
  await page.goto('/pricing');
  await page.evaluate(() => {
    localStorage.removeItem('fp-locale');
    document.cookie = 'fp-locale=; Max-Age=0; path=/';
  });
  await page.reload();
}

test.describe('Pricing page', () => {
  test.beforeEach(async ({ page, context }) => {
    await clearLocaleStorage(page, context);
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
    const freeCard = planCard(page, 'Free');
    await expect(freeCard.getByText('Free').first()).toBeVisible();
  });

  test('pro card shows $9/mo on monthly billing', async ({ page }) => {
    // Ensure monthly is active (default)
    await expect(page.getByRole('tab', { name: 'Monthly' })).toBeVisible();
    // Pro plan price
    const proCard = planCard(page, 'Pro');
    await expect(proCard.getByText('$9')).toBeVisible();
    await expect(proCard.getByText('/mo')).toBeVisible();
  });

  test('pro_plus card shows $12/mo on monthly billing', async ({ page }) => {
    const plusCard = planCard(page, 'Pro+');
    await expect(plusCard.getByText('$12')).toBeVisible();
  });

  // ── Billing toggle ───────────────────────────────────────────────
  test('billing toggle switches between Monthly and Annual', async ({ page }) => {
    const tablist = page.getByRole('tablist', { name: 'Billing period' });
    const monthlyTab = page.getByRole('tab', { name: 'Monthly' });
    const annualTab = page.getByRole('tab', { name: /Annual/i });
    await expect(tablist).toBeVisible();
    await expect(monthlyTab).toBeVisible();
    await expect(annualTab).toBeVisible();
    await expect(monthlyTab).toHaveAttribute('aria-selected', 'true');

    await annualTab.click();

    await expect(annualTab).toHaveAttribute('aria-selected', 'true');
    await expect(annualTab).toHaveClass(/bg-coral/);
  });

  test('"Save 20%" badge is visible on Annual button', async ({ page }) => {
    await expect(page.getByText('Save 20%')).toBeVisible();
  });

  test('switching to Annual updates Pro price to $7', async ({ page }) => {
    await page.getByRole('tab', { name: /Annual/i }).click();
    await page.waitForTimeout(100);

    const proCard = planCard(page, 'Pro');
    await expect(proCard.getByText('$7')).toBeVisible();
  });

  test('switching to Annual updates Pro+ price to $10', async ({ page }) => {
    await page.getByRole('tab', { name: /Annual/i }).click();
    await page.waitForTimeout(100);

    const plusCard = planCard(page, 'Pro+');
    await expect(plusCard.getByText('$10')).toBeVisible();
  });

  test('annual billing shows "Billed as $X/yr" text', async ({ page }) => {
    await page.getByRole('tab', { name: /Annual/i }).click();
    await page.waitForTimeout(100);

    // Pro: $7 * 12 = $84/yr
    await expect(page.getByText('Billed as $84/yr')).toBeVisible();
    // Pro+: $10 * 12 = $120/yr
    await expect(page.getByText('Billed as $120/yr')).toBeVisible();
  });

  // ── CTA buttons ───────────────────────────────────────────────────
  test('"Start for free" is a link to /sign-up', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Start for free' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/sign-up');
  });

  test('"Start Pro" while unauthenticated redirects to /sign-up?plan=pro', async ({
    page,
  }) => {
    const proCard = planCard(page, 'Pro');
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
    const plusCard = planCard(page, 'Pro+');
    const startPlusBtn = plusCard.getByRole('button', { name: 'Start Pro+' });
    await expect(startPlusBtn).toBeVisible();

    await startPlusBtn.click();
    await page.waitForURL(/\/sign-up\?plan=pro_plus/, { timeout: 8000 });
    expect(page.url()).toContain('/sign-up?plan=pro_plus');
  });

  // ── Features lists ───────────────────────────────────────────────
  test('Free plan features are listed', async ({ page }) => {
    await expect(page.getByText('3 lesson plans per month')).toBeVisible();
    await expect(page.getByText('Fast mode')).toBeVisible();
    await expect(page.getByText('DOCX export')).toBeVisible();
    await expect(page.getByText('Filled-in template download')).toBeVisible();
  });

  test('Pro plan features are listed', async ({ page }) => {
    await expect(page.getByText('Everything in Free')).toBeVisible();
    await expect(page.getByText('20 lesson plans per month')).toBeVisible();
    await expect(page.getByText('Fast and Quality modes')).toBeVisible();
    await expect(page.getByText('OCR text extraction')).toBeVisible();
  });

  test('Pro+ plan features are listed', async ({ page }) => {
    await expect(page.getByText('Unlimited lesson plans')).toBeVisible();
    await expect(page.getByText('Everything in Pro')).toBeVisible();
  });

  // ── Trust footer ─────────────────────────────────────────────────
  test('trust footer text is visible', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(
      page.getByText(/paid plans include a 30-day free trial.*cancel anytime/i),
    ).toBeVisible();
  });

  // ── Accessibility ─────────────────────────────────────────────────
  test('billing period tabs expose aria-selected state', async ({ page }) => {
    const monthlyTab = page.getByRole('tab', { name: 'Monthly' });
    const annualTab = page.getByRole('tab', { name: /Annual/i });
    await expect(monthlyTab).toHaveAttribute('aria-selected', 'true');
    await expect(annualTab).toHaveAttribute('aria-selected', 'false');
    await annualTab.click();
    await expect(annualTab).toHaveAttribute('aria-selected', 'true');
    await expect(monthlyTab).toHaveAttribute('aria-selected', 'false');
  });

  test('all CTAs meet minimum 44px touch target height', async ({ page }) => {
    const ctaSelectors = [
      page.getByRole('link', { name: 'Start for free' }),
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

      test.beforeEach(async ({ page, context }) => {
        await clearLocaleStorage(page, context);
      });

      test(`Pro+ CTA uses mustard background in ${scheme} mode`, async ({ page }) => {
        const plusCard = planCard(page, 'Pro+');
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
        await expect(page.getByText(/paid plans include a 30-day free trial/i)).toBeVisible();
      });
    });
  }
});

// ── Locale persistence ────────────────────────────────────────────
test.describe('Pricing page – locale persistence', () => {
  test('uses French copy after navigating from the landing page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('fp-locale', 'fr');
      document.cookie = 'fp-locale=fr; path=/; max-age=31536000; SameSite=Lax';
    });
    await page.reload();

    await page.getByRole('banner').getByRole('link', { name: fr.landing.headerPricing }).click();
    await page.waitForURL('**/pricing', { timeout: 8000 });

    await expect(page.getByRole('heading', { name: fr.pricing.title, level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: fr.settings.language })).toBeVisible();

    for (const cta of [
      page.getByRole('link', { name: fr.pricing.plans.free.cta }),
      page.getByRole('button', { name: fr.pricing.plans.pro.cta }),
      page.getByRole('button', { name: fr.pricing.plans.pro_plus.cta }),
    ]) {
      const box = await cta.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

// ── Landing page integration ──────────────────────────────────────
test.describe('Landing page has Pricing link', () => {
  test.beforeEach(async ({ page, context }) => {
    await clearLocaleStorage(page, context);
  });

  test('Pricing link in nav points to /pricing', async ({ page }) => {
    await page.goto('/');
    const pricingLink = page.getByRole('banner').getByRole('link', { name: 'Pricing' });
    await expect(pricingLink).toBeVisible();
    await expect(pricingLink).toHaveAttribute('href', '/pricing');
  });

  test('clicking Pricing nav link navigates to /pricing page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('banner').getByRole('link', { name: 'Pricing' }).click();
    await page.waitForURL('**/pricing', { timeout: 8000 });
    await expect(
      page.getByRole('heading', { name: 'Plans for every classroom', level: 1 }),
    ).toBeVisible();
  });
});

test.describe('Pricing page – locale and theme motion', () => {
  test.beforeEach(async ({ page, context }) => {
    await clearLocaleStorage(page, context);
  });

  test('locale switch keeps the heading visible and updates copy', async ({ page }) => {
    await page.goto('/pricing');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    const initialOpacity = await heading.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(initialOpacity)).toBeGreaterThan(0);
    await expect(heading).toHaveClass(/t-text-swap/);

    await page.getByRole('button', { name: /language/i }).click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveClass(/t-dropdown/);
    await page.getByRole('menuitem', { name: 'Español' }).click();

    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Planes para cada aula/i);
    const afterOpacity = await heading.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(afterOpacity)).toBeGreaterThan(0);
    await expect(page.getByText(/Empieza gratis y mejora cuando quieras/i)).toBeVisible();
  });

  test('theme toggle works from pricing without hiding the heading', async ({ page }) => {
    await page.goto('/pricing');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    const toggle = page.getByRole('button', { name: /switch to dark mode/i });
    await expect(toggle).toBeVisible();
    await expect(toggle.locator('.t-icon-swap')).toHaveAttribute('data-state', 'a');
    await toggle.click();

    await expect(page.getByRole('button', { name: /switch to light mode/i })).toBeVisible();
    await expect(page.locator('.t-icon-swap').first()).toHaveAttribute('data-state', 'b');
    const darkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(darkClass).toBe(true);
    await expect(heading).toBeVisible();
    const opacity = await heading.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0);
  });
});
