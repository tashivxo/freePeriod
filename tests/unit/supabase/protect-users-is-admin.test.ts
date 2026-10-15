import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function readSqlFiles(): { name: string; sql: string }[] {
  const schema = {
    name: 'lib/supabase/schema.sql',
    sql: readFileSync(path.join(ROOT, 'lib/supabase/schema.sql'), 'utf8'),
  };
  const migrationsDir = path.join(ROOT, 'supabase/migrations');
  const migrations = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => ({
      name: `supabase/migrations/${file}`,
      sql: readFileSync(path.join(migrationsDir, file), 'utf8'),
    }));
  return [schema, ...migrations];
}

function extractFunctionBody(sql: string, functionName: string): string | null {
  const pattern = new RegExp(
    `create(?:\\s+or\\s+replace)?\\s+function\\s+${functionName.replace('.', '\\.')}\\s*\\([\\s\\S]*?\\$\\$[\\s\\S]*?\\$\\$`,
    'i',
  );
  const match = sql.match(pattern);
  return match ? match[0] : null;
}

function latestProtectUsersIsAdmin(): { source: string; body: string } {
  let latest: { source: string; body: string } | null = null;
  for (const file of readSqlFiles()) {
    const body = extractFunctionBody(file.sql, 'public.protect_users_is_admin');
    if (body) latest = { source: file.name, body };
  }
  if (!latest) {
    throw new Error('protect_users_is_admin function not found in schema or migrations');
  }
  return latest;
}

describe('protect_users_is_admin', () => {
  it('does not skip the is_admin check based on current_user', () => {
    const { source, body } = latestProtectUsersIsAdmin();
    expect(source).toBeTruthy();
    expect(body).not.toMatch(/current_user\s+in\s*\(\s*'postgres'/i);
  });

  it('allows privileged writes via JWT service_role or session_user, not current_user', () => {
    const { body } = latestProtectUsersIsAdmin();
    expect(body).toMatch(/auth\.jwt\(\)\s*->>\s*'role'|auth\.role\(\)/);
    expect(body).toMatch(/service_role/);
    expect(body).toMatch(/session_user/);
    expect(body).not.toMatch(/\bcurrent_user\b/);
  });
});
