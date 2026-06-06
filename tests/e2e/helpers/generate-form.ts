import { expect, type Page } from '@playwright/test';

export async function ensureGenerateFormIsSubmittable(page: Page) {
  const generateButton = page.getByRole('button', { name: /generate/i }).first();

  if (await generateButton.isEnabled()) {
    return generateButton;
  }

  await page.getByLabel(/^subject$/i).click();
  await page.getByRole('option', { name: 'Science' }).click();

  await page.getByLabel(/^grade$/i).click();
  await page.getByRole('option', { name: /grade 9|9/i }).first().click();

  await expect(generateButton).toBeEnabled({ timeout: 10000 });

  return generateButton;
}

export async function waitForLessonGeneration(page: Page) {
  await page.waitForURL(/\/lesson\/[0-9a-f-]+$/i, { timeout: 120000 });
}
