import {
  describeFillTemplateFailure,
  describeLessonExportFailure,
  FILLED_TEMPLATE_DOWNLOAD_MESSAGE,
  FILLED_TEMPLATE_UNFILLED_MESSAGE,
} from '@/lib/export/export-error';
import { TEMPLATE_UNFILLED_CODE, TEMPLATE_UNFILLED_ERROR } from '@/lib/export/fill-template-result';

const BYTESTRING_ERROR =
  'TypeError: Cannot convert argument to a ByteString because the character at index 69 has a value of 8212 which is greater than 255.';

describe('describeFillTemplateFailure', () => {
  it('uses the short unfilled copy and hides the code in details', () => {
    expect(
      describeFillTemplateFailure(422, {
        error: TEMPLATE_UNFILLED_ERROR,
        code: TEMPLATE_UNFILLED_CODE,
      }),
    ).toEqual({
      message: FILLED_TEMPLATE_UNFILLED_MESSAGE,
      detail: 'HTTP 422 · TEMPLATE_UNFILLED',
    });
  });

  it('uses the download copy for a 500 and keeps a safe server note in details', () => {
    expect(
      describeFillTemplateFailure(500, {
        error: 'The template file could not be read.',
        code: 'TEMPLATE_DOWNLOAD_FAILED',
      }),
    ).toEqual({
      message: FILLED_TEMPLATE_DOWNLOAD_MESSAGE,
      detail: 'HTTP 500 · TEMPLATE_DOWNLOAD_FAILED\nThe template file could not be read.',
    });
  });

  it('drops a ByteString TypeError from both the headline and the details', () => {
    expect(describeFillTemplateFailure(500, { error: BYTESTRING_ERROR })).toEqual({
      message: FILLED_TEMPLATE_DOWNLOAD_MESSAGE,
      detail: 'HTTP 500',
    });
    expect(describeFillTemplateFailure(500, { error: 'Error\n    at fillTemplate' })).toEqual({
      message: FILLED_TEMPLATE_DOWNLOAD_MESSAGE,
      detail: 'HTTP 500',
    });
  });

  it('keeps a specific client error as the headline', () => {
    expect(
      describeFillTemplateFailure(400, {
        error: 'PDF template download is not supported. Upload a DOCX or XLSX template instead.',
      }),
    ).toEqual({
      message: 'PDF template download is not supported. Upload a DOCX or XLSX template instead.',
      detail: null,
    });
  });
});

describe('describeLessonExportFailure', () => {
  it('shows a safe API message and ignores a runtime exception', () => {
    expect(describeLessonExportFailure(500, { error: 'Export service unavailable' })).toEqual({
      message: 'Export service unavailable',
      detail: null,
    });
    expect(describeLessonExportFailure(500, { error: BYTESTRING_ERROR }).message).toBe(
      'Couldn’t download this lesson. Try again.',
    );
    expect(describeLessonExportFailure(500, { error: BYTESTRING_ERROR }).detail).not.toContain(
      'TypeError',
    );
  });
});
