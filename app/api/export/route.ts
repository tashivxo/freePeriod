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

  if (format === 'docx') {
    const { generateDocx } = await import('@/lib/export/docx');
    buffer = await generateDocx(lesson);
    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else {
    const { generatePdfFromLesson, PdfConversionUnavailableError } = await import(
      '@/lib/export/docx-to-pdf'
    );

    try {
      buffer = await generatePdfFromLesson(lesson);
    } catch (error) {
      if (error instanceof PdfConversionUnavailableError) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      throw error;
    }

    contentType = 'application/pdf';
  }

  const filename = buildExportFilename(lesson.subject, format as 'docx' | 'pdf');

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
