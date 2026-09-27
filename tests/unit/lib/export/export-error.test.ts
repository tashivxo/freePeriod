import { formatExportFailureMessage } from '@/lib/export/export-error';
import { TEMPLATE_UNFILLED_CODE, TEMPLATE_UNFILLED_ERROR } from '@/lib/export/fill-template-result';

describe('formatExportFailureMessage', () => {
  const fallback = 'Failed to export filled template';

  it('appends an API code to the teacher-facing error', () => {
    expect(
      formatExportFailureMessage(
        { error: TEMPLATE_UNFILLED_ERROR, code: TEMPLATE_UNFILLED_CODE },
        fallback,
      ),
    ).toBe(`${TEMPLATE_UNFILLED_ERROR} (${TEMPLATE_UNFILLED_CODE})`);
  });

  it('returns the API error when no code is present', () => {
    expect(formatExportFailureMessage({ error: 'Template storage is unavailable' }, fallback)).toBe(
      'Template storage is unavailable',
    );
  });

  it('keeps the generic fallback when the body has no usable error', () => {
    expect(formatExportFailureMessage(null, fallback)).toBe(fallback);
    expect(formatExportFailureMessage({ error: 'Error\n    at fillTemplate' }, fallback)).toBe(
      fallback,
    );
  });
});
