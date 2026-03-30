import { test, expect } from '@playwright/test';

test.describe('Sign-in page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/sign-in');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Sign In — FreePeriod');
  });

  test('renders logo, heading and form', async ({ page }) => {
    await expect(page.getByText('FreePeriod').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('renders social auth options', async ({ page }) => {
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /magic link/i })).toBeVisible();
  });

  test('"Sign up" link navigates to /sign-up', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL('/sign-up');
  });

  test('signs in with valid credentials and redirects to dashboard', async ({ page }) => {
    await page.getByLabel('Email').fill('testteacher@mailinator.com');
    await page.getByLabel('Password').fill('TestPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
  });
});

test.describe('Sign-up page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/sign-up');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Sign Up — FreePeriod');
  });

  test('renders logo, heading and registration form', async ({ page }) => {
    await expect(page.getByText('FreePeriod').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('"Sign in" link navigates to /sign-in', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/sign-in');
  });
});

test.describe('Auth guards', () => {
  test('unauthenticated user visiting /dashboard is redirected to sign-in', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('authenticated user visiting /sign-in is redirected to dashboard', async ({ page }) => {
    // Sign in first
    await page.context().clearCookies();
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill('testteacher@mailinator.com');
    await page.getByLabel('Password').fill('TestPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    // Now try to visit sign-in again
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/dashboard/);
  });
});
