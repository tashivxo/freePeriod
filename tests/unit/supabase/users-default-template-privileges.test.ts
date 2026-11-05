import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const MIGRATION_014 = path.join(
  process.cwd(),
  'supabase/migrations/014_users_default_template.sql',
);
const MIGRATION_011 = path.join(
  process.cwd(),
  'supabase/migrations/011_lock_users_update_columns.sql',
);
const MIGRATION_012 = path.join(
  process.cwd(),
  'supabase/migrations/012_lock_lesson_plans_update_columns.sql',
);
const MIGRATION_013 = path.join(
  process.cwd(),
  'supabase/migrations/013_lock_users_insert_columns.sql',
);

const PROFILE_COLUMNS_011 = [
  'name',
  'country',
  'default_curriculum',
  'default_grade',
  'default_subject',
  'onboarding_complete',
  'preferred_locale',
];

const DEFAULT_TEMPLATE_COLUMNS = ['default_template_path', 'default_template_file_name'];

const PRIVILEGED_UPDATE_COLUMNS = [
  'is_admin',
  'plan',
  'generation_count',
  'generation_count_reset_at',
  'id',
  'email',
  'created_at',
];

const INSERT_COLUMNS_013 = [
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

function parseGrantColumns(sql: string, kind: 'update' | 'insert'): string[] {
  const re = new RegExp(
    `grant\\s+${kind}\\s*\\(([^)]+)\\)\\s+on\\s+(table\\s+)?public\\.users`,
    'gi',
  );
  const cols: string[] = [];
  for (const match of sql.matchAll(re)) {
    const granted = match[1]
      .split(',')
      .map((col) => col.trim().replace(/"/g, '').toLowerCase())
      .filter(Boolean);
    cols.push(...granted);
  }
  return cols;
}

describe('014_users_default_template', () => {
  it('exists in the migrations folder', () => {
    expect(existsSync(MIGRATION_014)).toBe(true);
  });

  it('adds both columns with IF NOT EXISTS', () => {
    const sql = readFileSync(MIGRATION_014, 'utf8');
    expect(sql).toMatch(
      /alter table public\.users\s+add column if not exists default_template_path text/i,
    );
    expect(sql).toMatch(
      /alter table public\.users\s+add column if not exists default_template_file_name text/i,
    );
  });

  it('adds pair CHECK for both null or both non-empty', () => {
    const sql = readFileSync(MIGRATION_014, 'utf8');
    expect(sql).toMatch(/users_default_template_pair_check/i);
    expect(sql).toMatch(
      /default_template_path\s+is\s+null\)\s*=\s*\(\s*default_template_file_name\s+is\s+null/i,
    );
    expect(sql).toMatch(/length\s*\(\s*trim\s*\(\s*default_template_path\s*\)\s*\)\s*>\s*0/i);
  });

  it('grants UPDATE on the two columns only (additive)', () => {
    const sql = readFileSync(MIGRATION_014, 'utf8');
    expect(sql).toMatch(
      /grant\s+update\s*\(\s*default_template_path\s*,\s*default_template_file_name\s*\)\s+on\s+(table\s+)?public\.users\s+to\s+authenticated/i,
    );
    expect(sql).not.toMatch(/revoke\s+update\s+on\s+(table\s+)?public\.users/i);
  });

  it('does not grant INSERT on the new columns', () => {
    const sql = readFileSync(MIGRATION_014, 'utf8');
    expect(sql).not.toMatch(/grant\s+insert/i);
  });

  it('combined 011 and 014 UPDATE grants include default template columns and exclude privileged columns', () => {
    const sql011 = readFileSync(MIGRATION_011, 'utf8');
    const sql014 = readFileSync(MIGRATION_014, 'utf8');
    const granted = [...parseGrantColumns(sql011, 'update'), ...parseGrantColumns(sql014, 'update')];

    for (const column of [...PROFILE_COLUMNS_011, ...DEFAULT_TEMPLATE_COLUMNS]) {
      expect(granted).toContain(column);
    }
    for (const column of PRIVILEGED_UPDATE_COLUMNS) {
      expect(granted).not.toContain(column);
    }
  });

  it('013 INSERT grant still excludes default template columns', () => {
    const sql013 = readFileSync(MIGRATION_013, 'utf8');
    const granted = parseGrantColumns(sql013, 'insert');
    for (const column of INSERT_COLUMNS_013) {
      expect(granted).toContain(column);
    }
    for (const column of DEFAULT_TEMPLATE_COLUMNS) {
      expect(granted).not.toContain(column);
    }
  });

  it('012 still excludes template_path from UPDATE grant', () => {
    const sql012 = readFileSync(MIGRATION_012, 'utf8');
    const granted = parseGrantColumns(sql012, 'update');
    expect(granted).not.toContain('template_path');
  });

  it('trigger rejects invalid default_template_path values', () => {
    const sql = readFileSync(MIGRATION_014, 'utf8');
    expect(sql).toMatch(/protect_users_default_template_path/i);
    expect(sql).toMatch(/\.\./);
    expect(sql).toMatch(/\\%/);
    expect(sql).toMatch(/like '\/%'/i);
    expect(sql).toMatch(/\/template\//);
    expect(sql).toMatch(/new\.id::text \|\| '\/template\//);
  });

  it('011 file text is unchanged (no default_template_)', () => {
    const sql011 = readFileSync(MIGRATION_011, 'utf8');
    expect(sql011).not.toMatch(/default_template_/);
  });
});
