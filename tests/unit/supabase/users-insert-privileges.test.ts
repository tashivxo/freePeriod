import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const MIGRATION = path.join(
  process.cwd(),
  'supabase/migrations/013_lock_users_insert_columns.sql',
);

const INSERT_COLUMNS = [
  'id',
  'email',
  'name',
  'default_subject',
  'default_grade',
  'default_curriculum',
  'country',
  'preferred_locale',
  'onboarding_complete',
];

const PRIVILEGED_COLUMNS = [
  'plan',
  'is_admin',
  'generation_count',
  'generation_count_reset_at',
  'deletion_scheduled_at',
  'created_at',
];

describe('013_lock_users_insert_columns', () => {
  it('is present in the migrations folder', () => {
    expect(existsSync(MIGRATION)).toBe(true);
  });

  it('revokes table INSERT from anon and authenticated, then grants profile columns only', () => {
    const sql = readFileSync(MIGRATION, 'utf8');
    expect(sql).toMatch(/revoke\s+insert\s+on\s+(table\s+)?public\.users\s+from\s+anon/i);
    expect(sql).toMatch(
      /revoke\s+insert\s+on\s+(table\s+)?public\.users\s+from\s+authenticated/i,
    );

    const grantMatch = sql.match(/grant\s+insert\s*\(([^)]+)\)\s+on\s+(table\s+)?public\.users/i);
    expect(grantMatch).not.toBeNull();
    const granted = (grantMatch?.[1] ?? '')
      .split(',')
      .map((col) => col.trim().replace(/"/g, '').toLowerCase())
      .filter(Boolean);

    for (const column of INSERT_COLUMNS) {
      expect(granted).toContain(column);
    }
    for (const column of PRIVILEGED_COLUMNS) {
      expect(granted).not.toContain(column);
    }
  });

  it('does not grant INSERT or UPDATE on deletion_scheduled_at or billing columns', () => {
    const sql = readFileSync(MIGRATION, 'utf8');
    const grants = [...sql.matchAll(/grant\s+(insert|update)\s*\(([^)]+)\)/gi)];
    expect(grants.length).toBeGreaterThan(0);
    for (const match of grants) {
      const granted = match[2]
        .split(',')
        .map((col) => col.trim().replace(/"/g, '').toLowerCase());
      for (const column of PRIVILEGED_COLUMNS) {
        expect(granted).not.toContain(column);
      }
    }
  });
});

const INSERT_SITES = [
  'app/auth/callback/route.ts',
  'lib/supabase/middleware.ts',
  'app/(auth)/onboarding/OnboardingPage.tsx',
  'app/(auth)/sign-in/SignInPage.tsx',
  'app/(auth)/sign-up/SignUpPage.tsx',
  'app/(app)/settings/page.tsx',
];

describe('client users inserts', () => {
  it.each(INSERT_SITES)('%s omits plan, quota, is_admin, and deletion_scheduled_at', (rel) => {
    const src = readFileSync(path.join(process.cwd(), rel), 'utf8');
    const blocks = [
      ...src.matchAll(/from\(\s*'users'\s*\)\s*\.insert\(\s*\{([\s\S]*?)\}\s*\)/g),
    ];
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      const body = block[1];
      expect(body).not.toMatch(/\bplan\s*:/);
      expect(body).not.toMatch(/\bis_admin\s*:/);
      expect(body).not.toMatch(/\bgeneration_count\s*:/);
      expect(body).not.toMatch(/\bgeneration_count_reset_at\s*:/);
      expect(body).not.toMatch(/\bdeletion_scheduled_at\s*:/);
    }
  });
});
