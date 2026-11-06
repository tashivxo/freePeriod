import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

const UPLOADS_BUCKET = 'uploads';

export type LoadedDefaultTemplate =
  | { status: 'none' }
  | { status: 'present'; path: string; fileName: string }
  | { status: 'missing' };

type StorageObjectStatus = 'present' | 'missing' | 'unknown';

async function storageObjectStatus(
  supabase: SupabaseClient<Database>,
  storagePath: string,
): Promise<StorageObjectStatus> {
  const segments = storagePath.split('/');
  const fileName = segments.pop();
  const folder = segments.join('/');
  if (!fileName || !folder) return 'missing';

  const { data, error } = await supabase.storage.from(UPLOADS_BUCKET).list(folder, {
    limit: 100,
    search: fileName,
  });
  if (error) return 'unknown';
  if (data?.some((item) => item.name === fileName)) return 'present';
  return 'missing';
}

export async function loadDefaultTemplateForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<LoadedDefaultTemplate> {
  const { data: userRow, error } = await supabase
    .from('users')
    .select('default_template_path, default_template_file_name')
    .eq('id', userId)
    .maybeSingle();

  if (error || !userRow?.default_template_path) {
    return { status: 'none' };
  }

  const path = userRow.default_template_path;
  const fileName = userRow.default_template_file_name ?? path.split('/').pop() ?? 'template';

  const objectStatus = await storageObjectStatus(supabase, path);
  if (objectStatus === 'unknown') {
    return { status: 'present', path, fileName };
  }
  if (objectStatus === 'missing') {
    await supabase
      .from('users')
      .update({ default_template_path: null, default_template_file_name: null })
      .eq('id', userId);
    return { status: 'missing' };
  }

  return { status: 'present', path, fileName };
}
