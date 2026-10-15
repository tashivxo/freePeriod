import { PDFDocument, PDFTextField } from 'pdf-lib';
import type { LessonPlan } from '@/types';
import { buildTemplateData } from '@/lib/lesson/template-data';
import {
  buildFieldMap,
  normalizeLabel,
  type FillGenericTemplateResult,
} from '@/lib/export/fill-generic-template';
import { embedPdfUnicodeFont } from '@/lib/export/pdf-fonts';
import { unicodeTextFieldAppearanceProvider } from '@/lib/export/pdf-field-appearance';
import { normalizePdfPunctuation } from '@/lib/export/pdf-text';

export function pdfFieldLookupKey(fieldName: string): string {
  return normalizeLabel(
    fieldName
      .replace(/\{\{|\}\}/g, ' ')
      .replace(/[_/]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2'),
  );
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
 *
 * Field values keep logical Unicode (Arabic included). Appearances embed a
 * Noto Sans Arabic + Latin OFL font and draw shaped, bidi-reordered glyphs
 * because pdf-lib does not shape Arabic or apply the Unicode Bidirectional
 * Algorithm.
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
  const filledFields: PDFTextField[] = [];

  for (const field of form.getFields()) {
    if (!(field instanceof PDFTextField)) continue;
    const name = field.getName();
    const value = valueForPdfField(name, lesson);
    if (!value?.trim()) continue;

    const maxLength = field.getMaxLength();
    let text = normalizePdfPunctuation(value);
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
    filledFields.push(field);
  }

  if (filledFields.length > 0) {
    try {
      const font = await embedPdfUnicodeFont(pdfDoc);
      const appearances = unicodeTextFieldAppearanceProvider();
      for (const field of filledFields) {
        try {
          field.updateAppearances(font, appearances);
        } catch {
          // Values are still stored even if appearance streams cannot be rebuilt.
        }
      }
    } catch {
      // Values are still stored even if the Unicode font cannot be embedded.
    }
  }

  return {
    buffer: Buffer.from(await pdfDoc.save({ updateFieldAppearances: false })),
    filledCount,
    matchedLabels,
    formFieldCount,
  };
}
