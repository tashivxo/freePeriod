import { test, expect } from '@playwright/test';
import { AUTH_FILE } from './helpers/auth';
import { ensureGenerateFormIsSubmittable, waitForLessonGeneration } from './helpers/generate-form';

test.describe('lesson generation save flow', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: AUTH_FILE });

  test('generation saves successfully and shows up on dashboard', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto('/generate');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/specific focus or requirements/i).fill(`Save verification ${Date.now()}`);

    const generateButton = await ensureGenerateFormIsSubmittable(page);
    await generateButton.click();

    await expect(page.getByRole('status', { name: /generating lesson plan/i })).toBeVisible({ timeout: 15000 });
    await waitForLessonGeneration(page);

    await expect(page.getByText('Failed to save lesson plan')).toHaveCount(0);
    await expect(page.getByText(/generation is busy/i)).toHaveCount(0);

    const lessonId = page.url().split('/lesson/')[1] ?? '';
    expect(lessonId).toMatch(/^[0-9a-f-]+$/i);

    const lessonTitle = (await page.getByRole('heading', { level: 1 }).textContent())?.trim() ?? '';
    expect(lessonTitle.length).toBeGreaterThan(0);

    await expect(page.getByRole('button', { name: 'Learning Objectives', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Main Activities', exact: true })).toBeVisible();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`a[href="/lesson/${lessonId}"]`).first()).toBeVisible({ timeout: 30000 });
  });

  test('saved lesson plan is retrievable from dashboard', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const firstLesson = page.locator('a[href^="/lesson/"]').first();
    await expect(firstLesson).toBeVisible({ timeout: 30000 });
    const lessonHref = await firstLesson.getAttribute('href');
    expect(lessonHref).toMatch(/^\/lesson\/[0-9a-f-]+$/i);

    await firstLesson.click();
    await page.waitForURL(/\/lesson\/[0-9a-f-]+$/i, { timeout: 30000 });
    await expect(page).toHaveURL(new RegExp(`${lessonHref?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));

    await expect(page.getByRole('button', { name: 'Learning Objectives', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Success Criteria', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Plenary', exact: true })).toBeVisible();
  });
});

test.describe('generate api authentication', () => {
  test('unauthenticated users cannot save', async ({ request }) => {
    const response = await request.post('/api/generate', {
      data: {
        subject: 'Science',
        grade: '9',
        curriculum: '',
        duration: 60,
        teacherPrompt: 'Unauthenticated regression test',
        curriculumDocPath: null,
        templatePath: null,
      },
    });

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });
});
