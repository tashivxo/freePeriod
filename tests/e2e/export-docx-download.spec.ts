import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { AUTH_FILE } from './helpers/auth';

const OUTPUT_DIR = path.resolve(process.cwd(), 'test-results/manual-lesson-exports');

test.describe('production export download', () => {
  test.use({ storageState: AUTH_FILE });

  test('downloads PDF export with subject-based filename from an existing lesson', async ({ page, request }) => {
    test.setTimeout(120000);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const firstLesson = page.locator('a[href^="/lesson/"]').first();
    await expect(firstLesson).toBeVisible({ timeout: 30000 });
    await firstLesson.click();
    await page.waitForURL(/\/lesson\/[0-9a-f-]+$/i, { timeout: 30000 });

    const lessonId = page.url().split('/lesson/')[1] ?? '';
    expect(lessonId).toMatch(/^[0-9a-f-]+$/i);

    const exportResponse = await request.post('/api/export', {
      data: { lessonId, format: 'pdf' },
    });

    expect(exportResponse.ok()).toBeTruthy();

    const disposition = exportResponse.headers()['content-disposition'] ?? '';
    expect(disposition).toMatch(/freeperiod_lesson_plan_[a-z0-9_]+\.pdf/);

    const buffer = await exportResponse.body();

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const outPath = path.join(OUTPUT_DIR, 'production-generated-lesson.pdf');
    fs.writeFileSync(outPath, buffer);

    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
