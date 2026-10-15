import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const MIGRATION = path.join(
  process.cwd(),
  'supabase/migrations/012_lock_lesson_plans_update_columns.sql',
);

const CLIENT_COLUMNS = ['content', 'updated_at'];

const LOCKED_COLUMNS = [
  'template_path',
  'user_id',
  'id',
  'created_at',
  'model_used',
  'token_count',
  'original_content',
];

describe('012_lock_lesson_plans_update_columns', () => {
  it('is present in the migrations folder', () => {
    expect(existsSync(MIGRATION)).toBe(true);
  });

  it('revokes table UPDATE from anon and authenticated, then grants client-writable columns only', () => {
    const sql = readFileSync(MIGRATION, 'utf8');
    expect(sql).toMatch(
      /revoke\s+update\s+on\s+(table\s+)?public\.lesson_plans\s+from\s+anon/i,
    );
    expect(sql).toMatch(
      /revoke\s+update\s+on\s+(table\s+)?public\.lesson_plans\s+from\s+authenticated/i,
    );

    const grantMatch = sql.match(
      /grant\s+update\s*\(([^)]+)\)\s+on\s+(table\s+)?public\.lesson_plans/i,
    );
    expect(grantMatch).not.toBeNull();
    const granted = (grantMatch?.[1] ?? '')
      .split(',')
      .map((col) => col.trim().replace(/"/g, '').toLowerCase())
      .filter(Boolean);

    for (const column of CLIENT_COLUMNS) {
      expect(granted).toContain(column);
    }
    for (const column of LOCKED_COLUMNS) {
      expect(granted).not.toContain(column);
    }
  });

  it('adds WITH CHECK so a user cannot reassign lesson_plans.user_id', () => {
    const sql = readFileSync(MIGRATION, 'utf8');
    expect(sql).toMatch(/with\s+check\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)/i);
  });
});
