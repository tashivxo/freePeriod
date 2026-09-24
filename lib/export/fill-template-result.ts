export const TEMPLATE_UNFILLED_CODE = 'TEMPLATE_UNFILLED';

export const TEMPLATE_UNFILLED_ERROR =
  "We couldn't fill this template because none of its fields matched your lesson. Use “Download a FreePeriod template” for a filled lesson plan, or upload a DOCX/XLSX template with labels such as Lesson Title, Objectives, or Activities.";

const DEFAULT_ONLY_LABELS = new Set(['materials', 'resources']);

/**
 * A fill is only "successful" when at least one cell received real lesson
 * content. Returning the original template (filledCount 0) or writing only
 * the hardcoded Materials/Resources default must not look like a filled download.
 */
export function isMeaningfulFill(
  filledCount: number,
  matchedLabels: readonly string[] = [],
): boolean {
  if (filledCount <= 0) return false;
  return matchedLabels.some((label) => !DEFAULT_ONLY_LABELS.has(label.trim().toLowerCase()));
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
