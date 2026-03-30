export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import createReport from 'docx-templates';
import * as XLSX from 'xlsx';
import { PDFDocument } from 'pdf-lib';
import type { LessonSection } from '@/types/database';

function joinField(value: unknown): string {
  if (Array.isArray(value)) return value.join('\n');
  if (typeof value === 'string') return value;
  return '';
}

function buildTemplateData(content: LessonSection): Record<string, string> {
  return {
    title: joinField(content.title),
    objectives: joinField(content.objectives),
    successCriteria: joinField(content.successCriteria),
    keyConcepts: joinField(content.keyConcepts),
    hook: joinField(content.hook),
    mainActivities: joinField(content.mainActivities),
    guidedPractice: joinField(content.guidedPractice),
    independentPractice: joinField(content.independentPractice),
    formativeAssessment: joinField(content.formativeAssessment),
    differentiationSupport: Array.isArray(content.differentiation)
      ? joinField(content.differentiation)
      : joinField((content.differentiation as Record<string, unknown>)?.support),
    differentiationExtension: Array.isArray(content.differentiation)
      ? ''
      : joinField((content.differentiation as Record<string, unknown>)?.extension),
    realWorldConnections: joinField(content.realWorldConnections),
    plenary: joinField(content.plenary),
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { lessonId: string };
  const { lessonId } = body;

  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
  }

  // Fetch the lesson — must belong to the authenticated user
  const { data: lesson, error: lessonError } = await supabase
    .from('lesson_plans')
    .select('id, title, content, template_path, user_id')
    .eq('id', lessonId)
    .eq('user_id', user.id)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  if (!lesson.template_path) {
    return NextResponse.json({ error: 'No template attached to this lesson' }, { status: 400 });
  }

  // Download template from Supabase Storage (service role to bypass RLS on storage)
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: fileData, error: downloadError } = await serviceClient.storage
    .from('uploads')
    .download(lesson.template_path);

  if (downloadError || !fileData) {
    return NextResponse.json({ error: 'Failed to download template' }, { status: 500 });
  }

  const templateBuffer = Buffer.from(await fileData.arrayBuffer());
  const ext = lesson.template_path.split('.').pop()?.toLowerCase() ?? '';
  const templateData = buildTemplateData(lesson.content as LessonSection);
  const filename = `${lesson.title || 'lesson-plan'}-filled.${ext}`;

  // ---------- DOCX ----------
  if (ext === 'docx') {
    const filled = await createReport({
      template: templateBuffer,
      data: templateData,
      failFast: false,
    });

    return new NextResponse(Buffer.from(filled), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  // ---------- XLSX ----------
  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(templateBuffer, { type: 'buffer' });

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      for (const cellAddr of Object.keys(sheet)) {
        if (cellAddr.startsWith('!')) continue;
        const cell = sheet[cellAddr];
        if (cell && cell.t === 's' && typeof cell.v === 'string') {
          // Replace {{fieldName}} placeholders
          let val: string = cell.v;
          for (const [key, replacement] of Object.entries(templateData)) {
            val = val.replaceAll(`{{${key}}}`, replacement);
          }
          if (val !== cell.v) {
            cell.v = val;
            cell.w = val;
          }
        }
      }
    }

    const out = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(out, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  // ---------- PDF ----------
  if (ext === 'pdf') {
    const pdfDoc = await PDFDocument.load(templateBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    if (fields.length === 0) {
      return NextResponse.json({ status: 'no_fields', message: 'This PDF has no form fields to fill.' });
    }

    for (const field of fields) {
      const fieldName = field.getName();
      const value = templateData[fieldName];
      if (value !== undefined) {
        try {
          const textField = form.getTextField(fieldName);
          textField.setText(value);
        } catch {
          // Field type not supported or name mismatch — skip
        }
      }
    }

    form.flatten();
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json({ error: 'Unsupported template format' }, { status: 400 });
}
