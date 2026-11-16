export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  buildLessonShareFile,
  lessonShareStoragePath,
} from '@/lib/share/build-lesson-share-file';
import { buildLessonShareSnapshot } from '@/lib/share/snapshot';
import { generateShareToken } from '@/lib/share/token';
import type { LessonPlan } from '@/types';

type RouteContext = { params: Promise<{ id: string }> };

function publicShareUrl(request: NextRequest, token: string): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  if (!host) {
    return `/s/${token}`;
  }
  return `${proto}://${host}/s/${token}`;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: lessonId } = await context.params;

  const { data: lesson, error: lessonError } = await supabase
    .from('lesson_plans')
    .select('*')
    .eq('id', lessonId)
    .eq('user_id', user.id)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  const admin = createAdminClient();
  const lessonRow = lesson as LessonPlan;

  const { data: existingShare } = await admin
    .from('lesson_shares')
    .select('token')
    .eq('lesson_id', lessonId)
    .maybeSingle();

  const token = existingShare?.token ?? generateShareToken();
  const snapshot = buildLessonShareSnapshot(lessonRow);

  let fileResult;
  try {
    fileResult = await buildLessonShareFile(lessonRow, admin);
  } catch {
    return NextResponse.json({ error: 'Failed to prepare lesson file' }, { status: 500 });
  }

  const filePath = lessonShareStoragePath(user.id, lessonId, fileResult.storageExt);

  const { error: uploadError } = await admin.storage
    .from('uploads')
    .upload(filePath, fileResult.buffer, {
      contentType: fileResult.contentType,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: 'Failed to store lesson file' }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await admin.from('lesson_shares').upsert(
    {
      lesson_id: lessonId,
      user_id: user.id,
      token,
      snapshot,
      file_path: filePath,
      file_name: fileResult.fileName,
      content_type: fileResult.contentType,
      updated_at: now,
    },
    { onConflict: 'lesson_id' },
  );

  if (upsertError) {
    return NextResponse.json({ error: 'Failed to save share link' }, { status: 500 });
  }

  return NextResponse.json({
    token,
    url: publicShareUrl(request, token),
    fileName: fileResult.fileName,
    contentType: fileResult.contentType,
    usedDocxFallback: fileResult.usedDocxFallback,
  });
}