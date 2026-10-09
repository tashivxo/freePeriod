import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const EM_DASH = '\u2014';
const APP_ROOT = path.join(process.cwd(), 'app');

const EXPECTED_METADATA_TITLES: Record<string, string> = {
  'app/layout.tsx': 'FreePeriod | AI Lesson Planner',
  'app/(auth)/sign-in/page.tsx': 'Sign In | FreePeriod',
  'app/(auth)/sign-up/page.tsx': 'Sign Up | FreePeriod',
  'app/(auth)/forgot-password/page.tsx': 'Reset Password | FreePeriod',
  'app/(auth)/reset-password/page.tsx': 'Reset Password | FreePeriod',
  'app/(auth)/update-password/page.tsx': 'Set New Password | FreePeriod',
  'app/(auth)/onboarding/page.tsx': 'Onboarding | FreePeriod',
  'app/pricing/page.tsx': 'Pricing | FreePeriod',
  'app/privacy/page.tsx': 'Privacy Policy | FreePeriod',
  'app/terms/page.tsx': 'Terms of Service | FreePeriod',
  'app/(app)/generate/page.tsx': 'Generate | FreePeriod',
  'app/(app)/history/page.tsx': 'Lesson Plan History | FreePeriod',
  'app/(app)/settings/page.tsx': 'Settings | FreePeriod',
};

function walkTsx(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...walkTsx(full));
    } else if (entry.name === 'page.tsx' || entry.name === 'layout.tsx') {
      found.push(full);
    }
  }
  return found;
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function extractMetadataTitle(source: string): string | null {
  const stripped = stripComments(source);
  if (!/export\s+const\s+metadata\b/.test(stripped)) return null;
  const match = stripped.match(/\btitle:\s*(['"`])([^'"`]+)\1/);
  return match?.[2] ?? null;
}

function collectMetadataTitles(): Record<string, string> {
  const titles: Record<string, string> = {};
  for (const file of walkTsx(APP_ROOT)) {
    const title = extractMetadataTitle(readFileSync(file, 'utf8'));
    if (!title) continue;
    titles[path.relative(process.cwd(), file)] = title;
  }
  return titles;
}

describe('page title metadata uses a pipe separator', () => {
  const titles = collectMetadataTitles();

  it('exports a title for every expected page and the root layout', () => {
    expect(Object.keys(titles).sort()).toEqual(Object.keys(EXPECTED_METADATA_TITLES).sort());
  });

  it('uses the pipe format and contains no em dash (U+2014)', () => {
    for (const [file, expected] of Object.entries(EXPECTED_METADATA_TITLES)) {
      expect({ file, title: titles[file] }).toEqual({ file, title: expected });
      expect(titles[file]).toContain(' | ');
      expect(titles[file]).not.toContain(EM_DASH);
      expect(titles[file]).not.toMatch(/, FreePeriod$|^FreePeriod,/);
    }
  });
});
