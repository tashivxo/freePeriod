import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { AUTH_FILE } from './helpers/auth';
import { ensureGenerateFormIsSubmittable, waitForLessonGeneration } from './helpers/generate-form';

const OUTPUT_DIR = path.resolve(process.cwd(), 'test-results/manual-lesson-exports');

test.describe('production export download', () => {
  test.use({ storageState: AUTH_FILE });

  test('generates a lesson and downloads PDF export with subject filename', async ({ page, request }) => {
    test.setTimeout(240000);

    await page.goto('/generate');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/specific focus or requirements/i).fill(`PDF export check ${Date.now()}`);

    const generateButton = await ensureGenerateFormIsSubmittable(page);
    await generateButton.click();

    await expect(page.getByRole('status', { name: /generating lesson plan/i })).toBeVisible({ timeout: 15000 });
    await waitForLessonGeneration(page);

    const lessonId = page.url().split('/lesson/')[1] ?? '';
    expect(lessonId).toMatch(/^[0-9a-f-]+$/i);

    const exportResponse = await request.post('/api/export', {
      data: { lessonId, format: 'pdf' },
    });

    expect(exportResponse.ok()).toBeTruthy();

    const disposition = exportResponse.headers()['content-disposition'] ?? '';
    expect(disposition).toMatch(/freeperiod_lesson_plan_science\.pdf/);

    const buffer = await exportResponse.body();

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const outPath = path.join(OUTPUT_DIR, 'production-generated-lesson.pdf');
    fs.writeFileSync(outPath, buffer);

    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
