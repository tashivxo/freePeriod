import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  parseFailureMessage,
  parseUploadedFile,
  UnsupportedFileTypeError,
} from '@/lib/parse/parse-uploaded-file';
import { requiresExtractedText, type ParsedContent } from '@/lib/parse/types';
import {
  getTemplateUploadError,
  isFillableTemplatePath,
  isTemplateStoragePath,
} from '@/lib/lesson/template-path';
import {
  isOwnedStoragePath,
  logStorageDownloadError,
  teacherStorageReadError,
} from '@/lib/parse/storage-download';
import type { UploadType } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

async function markUploadError(
  supabase: Awaited<ReturnType<typeof createClient>>,
  uploadId: string | undefined,
  userId: string,
  errorMessage: string,
  parsed?: ParsedContent,
) {
  if (!uploadId) return;
  await supabase
    .from('uploads')
    .update({
      parsed_content: {
        ...(parsed ?? {}),
        error: errorMessage,
      } as unknown as Record<string, unknown>,
    })
    .eq('id', uploadId)
    .eq('user_id', userId);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError('Unauthorized', 401);
    }

    const body = await request.json();
    const storagePath: string = body.storagePath;
    const uploadId: string | undefined = body.uploadId;
    let uploadType: UploadType | undefined =
      body.uploadType === 'template' || body.uploadType === 'curriculum_doc'
        ? body.uploadType
        : undefined;

    if (!storagePath) {
      return jsonError('storagePath is required', 400);
    }

    let ownedRowPath: string | null = null;

    if (uploadId) {
      const { data: uploadRow } = await supabase
        .from('uploads')
        .select('type, storage_path')
        .eq('id', uploadId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (uploadRow?.type === 'template' || uploadRow?.type === 'curriculum_doc') {
        if (!uploadType) uploadType = uploadRow.type;
      }
      if (typeof uploadRow?.storage_path === 'string') {
        ownedRowPath = uploadRow.storage_path;
      }
    }

    if (
      (uploadType === 'template' || isTemplateStoragePath(storagePath)) &&
      !isFillableTemplatePath(storagePath)
    ) {
      return jsonError(getTemplateUploadError(storagePath), 400);
    }

    if (!isOwnedStoragePath(user.id, storagePath, ownedRowPath) && !ownedRowPath) {
      const { data: pathRow } = await supabase
        .from('uploads')
        .select('storage_path')
        .eq('user_id', user.id)
        .eq('storage_path', storagePath)
        .maybeSingle();
      if (typeof pathRow?.storage_path === 'string') {
        ownedRowPath = pathRow.storage_path;
      }
    }

    if (!isOwnedStoragePath(user.id, storagePath, ownedRowPath)) {
      return jsonError(teacherStorageReadError(uploadType, storagePath), 403);
    }

    // Service role bypasses storage RLS after the ownership check above.
    let fileData: Blob | null = null;
    let downloadError: unknown = null;
    try {
      const admin = createAdminClient();
      const result = await admin.storage.from('uploads').download(storagePath);
      fileData = result.data;
      downloadError = result.error;
    } catch (error) {
      logStorageDownloadError({ storagePath, uploadId, uploadType, error });
      return jsonError(teacherStorageReadError(uploadType, storagePath), 502);
    }

    if (downloadError || !fileData) {
      logStorageDownloadError({
        storagePath,
        uploadId,
        uploadType,
        error: downloadError ?? { message: 'Empty file data' },
      });
      return jsonError(teacherStorageReadError(uploadType, storagePath), 502);
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const fileName = storagePath.split('/').pop() ?? '';

    let parsed: ParsedContent;

    try {
      parsed = await parseUploadedFile(buffer, fileName);
    } catch (error) {
      const errorMessage = parseFailureMessage(error);
      await markUploadError(supabase, uploadId, user.id, errorMessage);
      const status = error instanceof UnsupportedFileTypeError ? 400 : 500;
      return jsonError(errorMessage, status);
    }

    if (!parsed.text.trim() && requiresExtractedText(uploadType)) {
      const errorMessage =
        'No readable text was found in this document. Please upload a clearer curriculum file.';
      await markUploadError(supabase, uploadId, user.id, errorMessage, parsed);
      return jsonError(errorMessage, 422);
    }

    if (uploadId) {
      await supabase
        .from('uploads')
        .update({ parsed_content: parsed as unknown as Record<string, unknown> })
        .eq('id', uploadId)
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      text: parsed.text,
      type: parsed.type,
      metadata: parsed.metadata ?? {},
      preview: parsed.text.slice(0, 500),
    });
  } catch (error) {
    return jsonError(parseFailureMessage(error), 500);
  }
}
