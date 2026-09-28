import { isTemplateStoragePath } from '@/lib/lesson/template-path';
import type { UploadType } from '@/types';

export const TEMPLATE_STORAGE_READ_ERROR =
  'Couldn\u2019t read your template. Try uploading again.';

export const DOCUMENT_STORAGE_READ_ERROR =
  'Couldn\u2019t read your document. Try uploading again.';

type StorageErrorLike = {
  message?: string;
  statusCode?: string | number;
  status?: string | number;
  name?: string;
};

export function teacherStorageReadError(
  uploadType?: UploadType,
  storagePath?: string,
): string {
  if (uploadType === 'template' || isTemplateStoragePath(storagePath)) {
    return TEMPLATE_STORAGE_READ_ERROR;
  }
  return DOCUMENT_STORAGE_READ_ERROR;
}

/**
 * Service-role storage downloads must only proceed for objects the
 * authenticated user owns: path prefix `${userId}/` and/or an uploads row
 * for that user whose storage_path matches.
 */
export function isOwnedStoragePath(
  userId: string,
  storagePath: string,
  ownedRowPath?: string | null,
): boolean {
  if (!userId || !storagePath) return false;
  if (
    storagePath.includes('..') ||
    storagePath.includes('\\') ||
    storagePath.startsWith('/')
  ) {
    return false;
  }
  if (storagePath.startsWith(`${userId}/`)) return true;
  return Boolean(ownedRowPath) && ownedRowPath === storagePath;
}

export function logStorageDownloadError(details: {
  storagePath: string;
  uploadId?: string;
  uploadType?: UploadType;
  error: unknown;
}): void {
  const err =
    details.error && typeof details.error === 'object'
      ? (details.error as StorageErrorLike)
      : null;
  console.error('[parse-document] storage download failed', {
    storagePath: details.storagePath,
    uploadId: details.uploadId,
    uploadType: details.uploadType,
    message: err?.message ?? String(details.error),
    statusCode: err?.statusCode ?? err?.status,
    name: err?.name,
  });
}
