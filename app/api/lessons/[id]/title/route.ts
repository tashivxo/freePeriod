export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseLessonTitle } from '@/lib/lesson/title';

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseLessonTitle((body as { title?: unknown })?.title);
  if (!parsed.ok) {
    const message = parsed.reason === 'missing' ? 'Title is required' : 'Invalid title';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('lesson_plans')
    .select('id')
    .eq('id', lessonId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: lesson, error: updateError } = await admin
    .from('lesson_plans')
    .update({ title: parsed.title, updated_at: now })
    .eq('id', lessonId)
    .eq('user_id', user.id)
    .select('id, title, updated_at')
    .single();

  if (updateError || !lesson) {
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
  }

  return NextResponse.json({ lesson });
}