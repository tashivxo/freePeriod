export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isFillableTemplatePath } from '@/lib/lesson/template-path';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: lessonId } = await context.params;

  let body: { templatePath?: string };
  try {
    body = (await request.json()) as { templatePath?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { templatePath } = body;

  if (!templatePath || typeof templatePath !== 'string') {
    return NextResponse.json({ error: 'templatePath is required' }, { status: 400 });
  }

  const allowedPrefix = `${user.id}/template/`;
  if (!templatePath.startsWith(allowedPrefix)) {
    return NextResponse.json({ error: 'Invalid template path' }, { status: 403 });
  }

  if (!isFillableTemplatePath(templatePath)) {
    return NextResponse.json(
      { error: 'Template must be a DOCX or XLSX file' },
      { status: 400 },
    );
  }

  const { data: existingLesson, error: lessonFetchError } = await supabase
    .from('lesson_plans')
    .select('id, template_path')
    .eq('id', lessonId)
    .eq('user_id', user.id)
    .single();

  if (lessonFetchError || !existingLesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  const previousTemplatePath = existingLesson.template_path;

  const { data: uploadRow, error: uploadFetchError } = await supabase
    .from('uploads')
    .select('id')
    .eq('storage_path', templatePath)
    .eq('user_id', user.id)
    .eq('type', 'template')
    .maybeSingle();

  if (uploadFetchError || !uploadRow) {
    return NextResponse.json({ error: 'Template upload not found' }, { status: 400 });
  }

  const { data: lesson, error: lessonUpdateError } = await supabase
    .from('lesson_plans')
    .update({ template_path: templatePath })
    .eq('id', lessonId)
    .eq('user_id', user.id)
    .select('id, template_path')
    .single();

  if (lessonUpdateError || !lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  if (previousTemplatePath && previousTemplatePath !== templatePath) {
    const { error: unlinkError } = await supabase
      .from('uploads')
      .update({ lesson_id: null })
      .eq('storage_path', previousTemplatePath)
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId);

    if (unlinkError) {
      await supabase
        .from('lesson_plans')
        .update({ template_path: previousTemplatePath })
        .eq('id', lessonId)
        .eq('user_id', user.id);

      return NextResponse.json(
        { error: 'Failed to unlink previous template upload' },
        { status: 500 },
      );
    }
  }

  const { data: linkedUpload, error: linkError } = await supabase
    .from('uploads')
    .update({ lesson_id: lessonId })
    .eq('storage_path', templatePath)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (linkError || !linkedUpload) {
    await supabase
      .from('lesson_plans')
      .update({ template_path: previousTemplatePath })
      .eq('id', lessonId)
      .eq('user_id', user.id);

    return NextResponse.json(
      { error: 'Failed to link template upload to lesson' },
      { status: 500 },
    );
  }

  return NextResponse.json({ lesson });
}
