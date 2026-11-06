import type { SupabaseClient } from '@supabase/supabase-js';
import { isOwnedStoragePath } from '@/lib/parse/storage-download';
import type { Database } from '@/types';

const TEMPLATE_PREFIX = '/template/';

export function isValidDefaultTemplatePath(userId: string, storagePath: string): boolean {
  if (!userId || !storagePath) return false;
  if (!isOwnedStoragePath(userId, storagePath)) return false;
  return storagePath.startsWith(`${userId}${TEMPLATE_PREFIX}`);
}

export type WriteUserDefaultTemplateResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_path' | 'update_failed' };

export async function writeUserDefaultTemplate(
  supabase: SupabaseClient<Database>,
  userId: string,
  value: { path: string; fileName: string } | null,
): Promise<WriteUserDefaultTemplateResult> {
  if (value && !isValidDefaultTemplatePath(userId, value.path)) {
    return { ok: false, reason: 'invalid_path' };
  }

  const payload = value
    ? {
        default_template_path: value.path,
        default_template_file_name: value.fileName,
      }
    : {
        default_template_path: null,
        default_template_file_name: null,
      };

  const { error } = await supabase.from('users').update(payload).eq('id', userId);
  if (error) return { ok: false, reason: 'update_failed' };
  return { ok: true };
}
