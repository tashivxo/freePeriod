import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  parseFailureMessage,
  parseUploadedFile,
  UnsupportedFileTypeError,
} from '@/lib/parse/parse-uploaded-file';
import { requiresExtractedText, type ParsedContent } from '@/lib/parse/types';
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

    if (uploadId && !uploadType) {
      const { data: uploadRow } = await supabase
        .from('uploads')
        .select('type')
        .eq('id', uploadId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (uploadRow?.type === 'template' || uploadRow?.type === 'curriculum_doc') {
        uploadType = uploadRow.type;
      }
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('uploads')
      .download(storagePath);

    if (downloadError || !fileData) {
      return jsonError('Failed to download file', 404);
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
