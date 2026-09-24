export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import createReport from 'docx-templates';
import * as XLSX from 'xlsx';
import { buildTemplateData } from '@/lib/lesson/template-data';
import { fillGenericDocxTemplate } from '@/lib/export/fill-generic-template';
import {
  TEMPLATE_UNFILLED_CODE,
  TEMPLATE_UNFILLED_ERROR,
  isMeaningfulFill,
  templateDataAppearsInText,
} from '@/lib/export/fill-template-result';
import type { LessonPlan, LessonSection } from '@/types';

export { buildTemplateData };

const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function unfilledTemplateResponse() {
  return NextResponse.json(
    { error: TEMPLATE_UNFILLED_ERROR, code: TEMPLATE_UNFILLED_CODE },
    { status: 422 },
  );
}

function filledFileResponse(buffer: Buffer, filename: string, contentType: string) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
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
    .select('id, title, subject, grade, duration_minutes, content, template_path, user_id')
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
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(templateBuffer);
    const xml = (await zip.file('word/document.xml')?.async('string')) ?? '';
    const cmdDelimCount = (xml.match(/\+\+\+/g) || []).length;

    if (cmdDelimCount > 0) {
      // Template authored with docx-templates command syntax (e.g. +++INS field+++)
      const filledBuffer = Buffer.from(
        await createReport({ template: templateBuffer, data: templateData, failFast: false }),
      );
      const filledZip = await JSZip.loadAsync(filledBuffer);
      const filledXml = (await filledZip.file('word/document.xml')?.async('string')) ?? '';
      const remainingDelims = (filledXml.match(/\+\+\+/g) || []).length;
      // Unchanged +++ count and no lesson text in the output means nothing filled.
      if (
        remainingDelims >= cmdDelimCount &&
        !templateDataAppearsInText(filledXml, templateData)
      ) {
        return unfilledTemplateResponse();
      }
      return filledFileResponse(filledBuffer, filename, DOCX_CONTENT_TYPE);
    }

    // Plain form-style template (labels in table cells, blank cells for values) —
    // fill by matching known field labels to the adjacent empty cell.
    const result = await fillGenericDocxTemplate(templateBuffer, {
      ...lesson,
      content: lesson.content as LessonSection,
    } as LessonPlan);
    if (!isMeaningfulFill(result.filledCount, result.matchedLabels)) {
      return unfilledTemplateResponse();
    }
    return filledFileResponse(result.buffer, filename, DOCX_CONTENT_TYPE);
  }

  // ---------- XLSX ----------
  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
    let replaceCount = 0;

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
            replaceCount += 1;
          }
        }
      }
    }

    if (replaceCount === 0) {
      return unfilledTemplateResponse();
    }

    const out = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return filledFileResponse(out as Buffer, filename, XLSX_CONTENT_TYPE);
  }

  if (ext === 'pdf') {
    return NextResponse.json(
      { error: 'PDF template download is not supported. Upload a DOCX or XLSX template instead.' },
      { status: 400 },
    );
  }

  return NextResponse.json({ error: 'Unsupported template format' }, { status: 400 });
}
