import { isOwnedStoragePath } from '@/lib/parse/storage-download';

const TEMPLATE_PREFIX = '/template/';

export function isValidDefaultTemplatePath(userId: string, storagePath: string): boolean {
  if (!userId || !storagePath) return false;
  if (!isOwnedStoragePath(userId, storagePath)) return false;
  return storagePath.startsWith(`${userId}${TEMPLATE_PREFIX}`);
}
