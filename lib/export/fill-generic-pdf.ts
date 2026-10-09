import {
  PDFDocument,
  PDFTextField,
  StandardFonts,
} from 'pdf-lib';
import type { LessonPlan } from '@/types';
import { buildTemplateData } from '@/lib/lesson/template-data';
import {
  buildFieldMap,
  normalizeLabel,
  type FillGenericTemplateResult,
} from '@/lib/export/fill-generic-template';

export function pdfFieldLookupKey(fieldName: string): string {
  return normalizeLabel(
    fieldName
      .replace(/\{\{|\}\}/g, ' ')
      .replace(/[_/]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2'),
  );
}

function toPdfWinAnsi(text: string): string {
  return text
    .replace(/\u2022/g, '-')
    .replace(/\u2014|\u2013/g, '-')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\t\n\r\x20-\x7E]/g, '');
}

export function valueForPdfField(
  fieldName: string,
  lesson: LessonPlan,
): string | undefined {
  const key = pdfFieldLookupKey(fieldName);
  if (!key) return undefined;

  const fromLabel = buildFieldMap(lesson).get(key);
  if (fromLabel?.trim()) return fromLabel;

  const data = buildTemplateData(lesson.content);
  for (const [dataKey, value] of Object.entries(data)) {
    if (!value.trim()) continue;
    if (pdfFieldLookupKey(dataKey) === key) return value;
  }
  return undefined;
}

/**
 * Fills PDF AcroForm text fields by matching field names to lesson labels
 * (the same map used for generic DOCX templates) and {{placeholder}} / camelCase
 * keys from `buildTemplateData`. Static PDFs without form fields are unchanged.
 */
export async function fillGenericPdfTemplate(
  templateBuffer: Buffer,
  lesson: LessonPlan,
): Promise<FillGenericTemplateResult> {
  const pdfDoc = await PDFDocument.load(templateBuffer, { ignoreEncryption: true });
  let form;
  try {
    form = pdfDoc.getForm();
  } catch {
    return {
      buffer: templateBuffer,
      filledCount: 0,
      matchedLabels: [],
      formFieldCount: 0,
    };
  }

  const formFieldCount = form.getFields().length;
  let filledCount = 0;
  const matchedLabels: string[] = [];

  for (const field of form.getFields()) {
    if (!(field instanceof PDFTextField)) continue;
    const name = field.getName();
    const value = valueForPdfField(name, lesson);
    if (!value?.trim()) continue;

    const maxLength = field.getMaxLength();
    let text = toPdfWinAnsi(value);
    if (typeof maxLength === 'number' && maxLength > 0) {
      text = text.slice(0, maxLength);
    }
    if (!text.trim()) continue;

    try {
      field.setText(text);
    } catch {
      continue;
    }
    filledCount += 1;
    matchedLabels.push(pdfFieldLookupKey(name));
  }

  try {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    form.updateFieldAppearances(font);
  } catch {
    // Values are still stored even if appearance streams cannot be rebuilt.
  }

  return {
    buffer: Buffer.from(await pdfDoc.save()),
    filledCount,
    matchedLabels,
    formFieldCount,
  };
}
