import { render, screen } from '@/lib/test-utils';
import {
  FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE,
  FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE,
  FILLED_TEMPLATE_PDF_NOTE,
} from './filled-template-copy';
import { FilledTemplateChoiceDialog } from './FilledTemplateChoiceDialog';

jest.mock('@/providers/zen-mode', () => ({
  useZenMode: () => ({ zenMode: true }),
}));

jest.mock('@/hooks/useFileUpload', () => ({
  useFileUpload: jest.fn(() => ({
    file: null,
    storagePath: null,
    uploadId: null,
    isUploading: false,
    error: null,
    handleFile: jest.fn(),
    removeFile: jest.fn(),
  })),
}));

describe('FilledTemplateChoiceDialog', () => {
  const onOpenChange = jest.fn();
  const onFreePeriodDownload = jest.fn();
  const onUseSharedTemplate = jest.fn();
  const onTemplateAttached = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows has-template copy and actions when a fillable template exists', () => {
    render(
      <FilledTemplateChoiceDialog
        open
        onOpenChange={onOpenChange}
        lessonId="lesson-1"
        variant="has-template"
        showPdfNote={false}
        onFreePeriodDownload={onFreePeriodDownload}
        onUseSharedTemplate={onUseSharedTemplate}
        onTemplateAttached={onTemplateAttached}
        freePeriodLoading={false}
        sharedTemplateLoading={false}
      />,
    );

    expect(screen.getByText(FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /freeperiod template/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use your template/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /upload one now/i })).not.toBeInTheDocument();
  });

  it('shows no-template copy and actions when no fillable template exists', () => {
    render(
      <FilledTemplateChoiceDialog
        open
        onOpenChange={onOpenChange}
        lessonId="lesson-1"
        variant="no-template"
        showPdfNote={false}
        onFreePeriodDownload={onFreePeriodDownload}
        onUseSharedTemplate={onUseSharedTemplate}
        onTemplateAttached={onTemplateAttached}
        freePeriodLoading={false}
        sharedTemplateLoading={false}
      />,
    );

    expect(screen.getByText(FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload one now/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /download freeperiod generated lesson plan/i }),
    ).toBeInTheDocument();
  });

  it('shows PDF note in no-template variant when showPdfNote is true', () => {
    render(
      <FilledTemplateChoiceDialog
        open
        onOpenChange={onOpenChange}
        lessonId="lesson-1"
        variant="no-template"
        showPdfNote
        onFreePeriodDownload={onFreePeriodDownload}
        onUseSharedTemplate={onUseSharedTemplate}
        onTemplateAttached={onTemplateAttached}
        freePeriodLoading={false}
        sharedTemplateLoading={false}
      />,
    );

    expect(screen.getByText(FILLED_TEMPLATE_PDF_NOTE)).toBeInTheDocument();
  });
});
