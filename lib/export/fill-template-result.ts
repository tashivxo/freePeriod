export const TEMPLATE_UNFILLED_CODE = 'TEMPLATE_UNFILLED';

export const TEMPLATE_UNFILLED_ERROR =
  "We couldn't fill this template because none of its fields matched your lesson. Use “Download a FreePeriod template” for a filled lesson plan, or upload a DOCX/XLSX template with labels such as Lesson Title, Objectives, or Activities.";

const HEADER_ONLY_LABELS = new Set([
  'materials',
  'resources',
  'module title',
  'lesson title',
  'lessons title',
  'lesson plan title',
  'title',
  'topic',
  'lesson topic',
  'theme',
  'lesson theme',
  'duration',
  'time allocation',
  'lesson duration',
  'subject',
  'grade',
  'grade level',
  'class',
  'year group',
  'grade/class',
]);

/**
 * A fill is only "successful" when at least one body field received lesson
 * content (objectives, essential question, vocabulary, activities, etc.).
 * Title + duration, or the hardcoded Materials/Resources default, is not enough
 * — those matches were the production under-fill on form-style templates.
 */
export function isMeaningfulFill(
  filledCount: number,
  matchedLabels: readonly string[] = [],
): boolean {
  if (filledCount <= 0) return false;
  return matchedLabels.some((label) => !HEADER_ONLY_LABELS.has(label.trim().toLowerCase()));
}

/** True when at least one non-trivial template-data value appears in the filled document. */
export function templateDataAppearsInText(
  text: string,
  data: Record<string, string>,
): boolean {
  const haystack = text.toLowerCase();
  return Object.values(data).some((value) => {
    const needle = value.trim();
    if (needle.length < 8) return false;
    return haystack.includes(needle.slice(0, 80).toLowerCase());
  });
}
