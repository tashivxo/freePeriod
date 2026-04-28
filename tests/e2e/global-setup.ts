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

  await page.goto(`${BASE_URL}/sign-in`);
  // Wait for the JS-hydrated form to be fully interactive
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('input[id="email"]', { timeout: 30000 });

  await page.getByLabel('Email').fill('testteacher@mailinator.com');
  await page.waitForSelector('input[id="password"]', { timeout: 15000 });
  await page.getByLabel('Password').fill('TestPass123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 45000 });

  // Save auth cookies/storage to file
  await context.storageState({ path: AUTH_FILE });

  await browser.close();
}

export default globalSetup;
