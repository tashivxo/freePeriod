import type { SupabaseClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { generateDocx } from '@/lib/export/docx';
import { buildExportFilename } from '@/lib/export/filename';
import { fillGenericDocxTemplate } from '@/lib/export/fill-generic-template';
import { fillGenericPdfTemplate } from '@/lib/export/fill-generic-pdf';
import { isMeaningfulFill } from '@/lib/export/fill-template-result';
import { isFillableTemplatePath } from '@/lib/lesson/template-path';
import { isOwnedStoragePath } from '@/lib/parse/storage-download';
import type { Database, LessonPlan, LessonSection } from '@/types';

const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PDF_CONTENT_TYPE = 'application/pdf';

export type LessonShareFileResult = {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  storageExt: string;
  usedDocxFallback: boolean;
};

async function buildDocxShareFile(lesson: LessonPlan): Promise<LessonShareFileResult> {
  const buffer = await generateDocx(lesson);
  return {
    buffer,
    fileName: buildExportFilename(lesson.subject),
    contentType: DOCX_CONTENT_TYPE,
    storageExt: 'docx',
    usedDocxFallback: false,
  };
}

async function tryFillTemplateShareFile(
  lesson: LessonPlan,
  serviceClient: SupabaseClient<Database>,
): Promise<LessonShareFileResult | null> {
  const templatePath = lesson.template_path;
  if (!templatePath || !isFillableTemplatePath(templatePath)) {
    return null;
  }
  if (!isOwnedStoragePath(lesson.user_id, templatePath)) {
    return null;
  }

  const { data: fileData, error: downloadError } = await serviceClient.storage
    .from('uploads')
    .download(templatePath);

  if (downloadError || !fileData) {
    return null;
  }

  const templateBuffer = Buffer.from(await fileData.arrayBuffer());
  const ext = templatePath.split('.').pop()?.toLowerCase() ?? '';
  const filename = `${lesson.title || 'lesson-plan'}-filled.${ext}`;
  const lessonPayload = {
    ...lesson,
    content: lesson.content as LessonSection,
  } as LessonPlan;

  try {
    if (ext === 'docx') {
      const result = await fillGenericDocxTemplate(templateBuffer, lessonPayload);
      if (!isMeaningfulFill(result.filledCount, result.matchedLabels)) {
        return null;
      }
      return {
        buffer: result.buffer,
        fileName: filename,
        contentType: DOCX_CONTENT_TYPE,
        storageExt: ext,
        usedDocxFallback: false,
      };
    }

    if (ext === 'xlsx' || ext === 'xls') {
      const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
      const { buildTemplateData } = await import('@/lib/lesson/template-data');
      const templateData = buildTemplateData(lesson.content as LessonSection);
      let replaceCount = 0;

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        for (const cellAddr of Object.keys(sheet)) {
          if (cellAddr.startsWith('!')) continue;
          const cell = sheet[cellAddr];
          if (cell && cell.t === 's' && typeof cell.v === 'string') {
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
        return null;
      }

      const out = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return {
        buffer: out as Buffer,
        fileName: filename,
        contentType: XLSX_CONTENT_TYPE,
        storageExt: ext,
        usedDocxFallback: false,
      };
    }

    if (ext === 'pdf') {
      const result = await fillGenericPdfTemplate(templateBuffer, lessonPayload);
      if (!isMeaningfulFill(result.filledCount, result.matchedLabels)) {
        return null;
      }
      return {
        buffer: result.buffer,
        fileName: filename,
        contentType: PDF_CONTENT_TYPE,
        storageExt: ext,
        usedDocxFallback: false,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function buildLessonShareFile(
  lesson: LessonPlan,
  serviceClient: SupabaseClient<Database>,
): Promise<LessonShareFileResult> {
  const filled = await tryFillTemplateShareFile(lesson, serviceClient);
  if (filled) {
    return filled;
  }
  const docx = await buildDocxShareFile(lesson);
  const hadFillableTemplate =
    Boolean(lesson.template_path) && isFillableTemplatePath(lesson.template_path);
  return {
    ...docx,
    usedDocxFallback: hadFillableTemplate,
  };
}

export function lessonShareStoragePath(userId: string, lessonId: string, ext: string): string {
  return `shares/${userId}/${lessonId}.${ext}`;
}