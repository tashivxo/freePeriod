import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as { lessonId?: string; format?: string };
  const { lessonId, format } = body;

  if (!lessonId || !format || !['docx', 'pdf'].includes(format)) {
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

  let buffer: Buffer;
  let contentType: string;
  let extension: string;

  if (format === 'docx') {
    const { generateDocx } = await import('@/lib/export/docx');
    buffer = await generateDocx(lesson);
    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    extension = 'docx';
  } else {
    const { generatePdf } = await import('@/lib/export/pdf');
    buffer = await generatePdf(lesson);
    contentType = 'application/pdf';
    extension = 'pdf';
  }

  const filename = `${lesson.title || 'lesson-plan'}.${extension}`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
