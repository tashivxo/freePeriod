import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const MIGRATION = path.join(
  process.cwd(),
  'supabase/migrations/011_lock_users_update_columns.sql',
);

const PROFILE_COLUMNS = [
  'name',
  'country',
  'default_curriculum',
  'default_grade',
  'default_subject',
  'onboarding_complete',
  'preferred_locale',
];

const PRIVILEGED_COLUMNS = [
  'is_admin',
  'plan',
  'generation_count',
  'generation_count_reset_at',
  'id',
  'email',
  'created_at',
];

describe('011_lock_users_update_columns', () => {
  it('is present in the migrations folder', () => {
    expect(existsSync(MIGRATION)).toBe(true);
  });

  it('revokes table UPDATE from anon and authenticated, then grants profile columns only', () => {
    const sql = readFileSync(MIGRATION, 'utf8');
    expect(sql).toMatch(/revoke\s+update\s+on\s+(table\s+)?public\.users\s+from\s+anon/i);
    expect(sql).toMatch(
      /revoke\s+update\s+on\s+(table\s+)?public\.users\s+from\s+authenticated/i,
    );
    expect(sql).toMatch(/grant\s+update\s*\(/i);

    const grantMatch = sql.match(/grant\s+update\s*\(([^)]+)\)\s+on\s+(table\s+)?public\.users/i);
    expect(grantMatch).not.toBeNull();
    const granted = (grantMatch?.[1] ?? '')
      .split(',')
      .map((col) => col.trim().replace(/"/g, '').toLowerCase())
      .filter(Boolean);

    for (const column of PROFILE_COLUMNS) {
      expect(granted).toContain(column);
    }
    for (const column of PRIVILEGED_COLUMNS) {
      expect(granted).not.toContain(column);
    }
  });

  it('adds WITH CHECK so users cannot change id on update', () => {
    const sql = readFileSync(MIGRATION, 'utf8');
    expect(sql).toMatch(/with\s+check\s*\(\s*auth\.uid\(\)\s*=\s*id\s*\)/i);
  });
});
