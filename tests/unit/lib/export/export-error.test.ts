import {
  FILLED_TEMPLATE_DOWNLOAD_MESSAGE,
  mapFillTemplateError,
  mapLessonExportError,
} from '@/lib/export/export-error';
import { TEMPLATE_UNFILLED_CODE, TEMPLATE_UNFILLED_ERROR } from '@/lib/export/fill-template-result';

const BYTESTRING_ERROR =
  'TypeError: Cannot convert argument to a ByteString because the character at index 69 has a value of 8212 which is greater than 255.';

describe('mapFillTemplateError', () => {
  it('uses the API unfilled message when the code is TEMPLATE_UNFILLED', () => {
    expect(
      mapFillTemplateError(422, {
        error: TEMPLATE_UNFILLED_ERROR,
        code: TEMPLATE_UNFILLED_CODE,
      }),
    ).toBe(TEMPLATE_UNFILLED_ERROR);
  });

  it('uses the download message for HTTP 500 and drops a TypeError', () => {
    expect(mapFillTemplateError(500, { error: BYTESTRING_ERROR })).toBe(
      FILLED_TEMPLATE_DOWNLOAD_MESSAGE,
    );
    expect(mapFillTemplateError(500, { error: 'Error\n    at fillTemplate' })).toBe(
      FILLED_TEMPLATE_DOWNLOAD_MESSAGE,
    );
    expect(mapFillTemplateError(500, null)).toBe(FILLED_TEMPLATE_DOWNLOAD_MESSAGE);
    expect(FILLED_TEMPLATE_DOWNLOAD_MESSAGE).not.toMatch(/TypeError|ByteString/);
  });

  it('shows a safe client error from the API', () => {
    expect(
      mapFillTemplateError(400, {
        error: 'PDF template download is not supported. Upload a DOCX or XLSX template instead.',
      }),
    ).toBe('PDF template download is not supported. Upload a DOCX or XLSX template instead.');
  });
});

describe('mapLessonExportError', () => {
  it('shows a safe API error and replaces a runtime exception with the fallback', () => {
    expect(mapLessonExportError({ error: 'Export service unavailable' }, 'Failed to export lesson')).toBe(
      'Export service unavailable',
    );
    expect(mapLessonExportError({ error: BYTESTRING_ERROR }, 'Failed to export lesson')).toBe(
      'Failed to export lesson',
    );
  });
});
