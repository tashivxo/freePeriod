import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.resolve(process.cwd(), 'tests/e2e/.auth/user.json');
const BASE_URL = process.env.BASE_URL ?? 'https://free-period.vercel.app';

async function globalSetup(_config: FullConfig) {
  // Ensure .auth directory exists
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/sign-in`);
  await page.waitForLoadState('domcontentloaded');

  await page.getByLabel('Email').fill('testteacher@mailinator.com');
  await page.getByLabel('Password').fill('TestPass123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });

  // Save auth cookies/storage to file
  await page.context().storageState({ path: AUTH_FILE });

  await browser.close();
}

export default globalSetup;
