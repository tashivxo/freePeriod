import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { AUTH_FILE } from './helpers/auth';

const OUTPUT_DIR = path.resolve(process.cwd(), 'test-results/manual-lesson-exports');
const TEMPLATE_PATH = path.resolve(
  process.env.OBSERVATION_LESSON_TEMPLATE ??
    'C:/Users/tashi/Downloads/observation_lesson_plan_updated.docx',
);

async function countDocxTables(buffer: Buffer): Promise<number> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml) return 0;
  return (xml.match(/<w:tbl>/g) || []).length;
}

test.describe('production tabular DOCX export', () => {
  test.use({ storageState: AUTH_FILE });

  test('downloads DOCX with five tables aligned to observation template', async ({ page, request }) => {
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
      data: { lessonId, format: 'docx' },
    });

    expect(exportResponse.ok()).toBeTruthy();

    const disposition = exportResponse.headers()['content-disposition'] ?? '';
    expect(disposition).toMatch(/freeperiod_lesson_plan_[a-z0-9_]+\.docx/);

    const buffer = Buffer.from(await exportResponse.body());
    const tableCount = await countDocxTables(buffer);
    expect(tableCount).toBe(5);

    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')?.async('string');
    expect(xml).toContain('Lesson Title');
    expect(xml).toContain('Planning and Pedagogical Approach');
    expect(xml).toContain('Teacher Activity');
    expect(xml).toContain('Self-Reflection: Data-Informed Future Planning');
    expect(xml).not.toContain('☑');

    if (fs.existsSync(TEMPLATE_PATH)) {
      const templateXml = await (
        await JSZip.loadAsync(fs.readFileSync(TEMPLATE_PATH))
      ).file('word/document.xml')!.async('string');
      const templateTables = (templateXml.match(/<w:tbl>/g) || []).length;
      expect(templateTables).toBeGreaterThanOrEqual(5);
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const outPath = path.join(OUTPUT_DIR, 'production-tabular-lesson.docx');
    fs.writeFileSync(outPath, buffer);

    expect(buffer.subarray(0, 2).toString()).toBe('PK');
  });
});
