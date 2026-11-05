import { test, expect } from '@playwright/test';

/**
 * Requires a seeded default template for the e2e teacher account
 * (users.default_template_path / default_template_file_name and storage object),
 * or upload via Settings in a setup step. Run with BASE_URL=http://localhost:3000.
 */
test('generate page shows default template filename without choosing a file', async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_DEFAULT_TEMPLATE_SEEDED,
    'Set E2E_DEFAULT_TEMPLATE_SEEDED=1 after seeding default template for the test teacher',
  );

  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill('testteacher@mailinator.com');
  await page.getByLabel(/password/i).fill('TestPass123!');
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.goto('/generate');
  await expect(page.getByText('Lesson Plan Template')).toBeVisible();
  await expect(page.getByText(/\.docx|\.pdf|\.xlsx|\.xls/i)).toBeVisible();
});
