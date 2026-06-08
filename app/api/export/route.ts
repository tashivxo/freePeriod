import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildExportFilename } from '@/lib/export/filename';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as { lessonId?: string; format?: string };
  const { lessonId, format } = body;

  if (!lessonId || format !== 'docx') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { data: lesson } = await supabase
    .from('lesson_plans')
    .select('*')
    .eq('id', lessonId)
    .eq('user_id', user.id)
    .single();

  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  const { generateDocx } = await import('@/lib/export/docx');
  const buffer = await generateDocx(lesson);
  const filename = buildExportFilename(lesson.subject);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
