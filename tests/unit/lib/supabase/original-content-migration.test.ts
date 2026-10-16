import fs from 'node:fs';
import path from 'node:path';

function originalContentMigrationSql(): string {
  const dir = path.join(process.cwd(), 'supabase/migrations');
  const files = fs.readdirSync(dir).filter((name) => name.includes('original_content'));
  expect(files.length).toBeGreaterThan(0);
  return fs.readFileSync(path.join(dir, files[0]!), 'utf8');
}

describe('lesson_plans original_content migration', () => {
  it('adds a nullable jsonb column and revokes UPDATE from authenticated and anon', () => {
    const sql = originalContentMigrationSql();

    expect(sql).toMatch(/add column if not exists original_content jsonb/i);
    expect(sql).not.toMatch(/original_content jsonb not null/i);
    expect(sql).toMatch(
      /REVOKE UPDATE\s*\(\s*original_content\s*\)\s+ON public\.lesson_plans\s+FROM authenticated,\s*anon/i,
    );
    expect(sql).not.toMatch(/GRANT UPDATE\s*\([^)]*original_content/i);
  });
});
