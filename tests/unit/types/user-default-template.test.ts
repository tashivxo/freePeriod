import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { User } from '@/types';

describe('User default template fields', () => {
  it('includes nullable default_template_path and default_template_file_name on User', () => {
    const user: User = {
      id: 'user-1',
      email: 'a@example.com',
      name: 'Test',
      default_subject: null,
      default_grade: null,
      default_curriculum: null,
      country: null,
      plan: 'free',
      is_admin: false,
      generation_count: 0,
      generation_count_reset_at: null,
      onboarding_complete: true,
      deletion_scheduled_at: null,
      preferred_locale: 'en',
      created_at: '2024-01-01T00:00:00Z',
      default_template_path: null,
      default_template_file_name: null,
    };
    expect(user.default_template_path).toBeNull();
    expect(user.default_template_file_name).toBeNull();
  });
});

describe('schema.sql default template columns', () => {
  const schema = readFileSync(
    path.join(process.cwd(), 'lib/supabase/schema.sql'),
    'utf8',
  );

  it('creates both columns as nullable text on public.users', () => {
    expect(schema).toMatch(/default_template_path\s+text/i);
    expect(schema).toMatch(/default_template_file_name\s+text/i);
  });

  it('enforces pair constraint: both null or both non-empty', () => {
    expect(schema).toMatch(/users_default_template_pair_check/i);
    expect(schema).toMatch(
      /default_template_path\s+is\s+null\)\s*=\s*\(\s*default_template_file_name\s+is\s+null/i,
    );
    expect(schema).toMatch(
      /length\s*\(\s*trim\s*\(\s*default_template_path\s*\)\s*\)\s*>\s*0/i,
    );
  });

  it('rejects path traversal, backslashes, and leading slash in trigger', () => {
    expect(schema).toMatch(/protect_users_default_template_path/i);
    expect(schema).toMatch(/\.\./);
    expect(schema).toMatch(/like '%\\\\%'/);
    expect(schema).toMatch(/like '\/%'/);
    expect(schema).toMatch(/\/template\//);
  });
});
