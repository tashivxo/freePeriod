import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.resolve(process.cwd(), 'tests/e2e/.auth/user.json');
const BASE_URL = process.env.BASE_URL ?? 'https://free-period.vercel.app';
const VERCEL_BYPASS_TOKEN = process.env.VERCEL_BYPASS_TOKEN;

async function globalSetup(_config: FullConfig) {
  // Ensure .auth directory exists
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...(VERCEL_BYPASS_TOKEN && {
      extraHTTPHeaders: {
        'x-vercel-protection-bypass': VERCEL_BYPASS_TOKEN,
      },
    }),
  });
  const page = await context.newPage();
  page.setDefaultTimeout(180000);

  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForSelector('input[id="email"]', { timeout: 60000 });

  await page.getByLabel('Email').fill('testteacher@mailinator.com');
  await page.waitForSelector('input[id="password"]', { timeout: 60000 });
  await page.locator('input#password').fill('TestPass123!');
  await page.getByRole('button', { name: /sign in/i }).click({ noWaitAfter: true });
  await page.waitForURL('**/dashboard', { timeout: 180000 });

  // Save auth cookies/storage to file
  await context.storageState({ path: AUTH_FILE });

  await browser.close();
}

export default globalSetup;
