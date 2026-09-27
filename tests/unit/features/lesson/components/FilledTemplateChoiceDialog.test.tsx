import { render, screen } from '@/tests/helpers';
import {
  BTN_UPLOAD_ONE_NOW,
  BTN_USE_SHARED_TEMPLATE,
  FILL_MY_TEMPLATE_LABEL,
  FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE,
  FILLED_TEMPLATE_NOT_FILLABLE_MESSAGE,
  FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE,
  FILLED_TEMPLATE_PDF_MESSAGE,
} from '@/features/lesson/components/filled-template-copy';
import { FilledTemplateChoiceDialog } from '@/features/lesson/components/FilledTemplateChoiceDialog';

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
  const onUseSharedTemplate = jest.fn();
  const onTemplateAttached = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderDialog(
    variant: 'has-template' | 'no-template' | 'not-fillable',
    notFillableKind?: 'pdf' | 'other',
  ) {
    render(
      <FilledTemplateChoiceDialog
        open
        onOpenChange={onOpenChange}
        lessonId="lesson-1"
        variant={variant}
        notFillableKind={notFillableKind}
        onUseSharedTemplate={onUseSharedTemplate}
        onTemplateAttached={onTemplateAttached}
        sharedTemplateLoading={false}
      />,
    );
  }

  it('shows the Fill my template title and only the shared-template action', () => {
    renderDialog('has-template');

    expect(screen.getByRole('heading', { name: FILL_MY_TEMPLATE_LABEL })).toBeInTheDocument();
    expect(screen.getByText(FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: BTN_USE_SHARED_TEMPLATE })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: BTN_UPLOAD_ONE_NOW })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
  });

  it('shows upload only when no template is attached', () => {
    renderDialog('no-template');

    expect(screen.getByText(FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: BTN_UPLOAD_ONE_NOW })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: BTN_USE_SHARED_TEMPLATE })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
  });

  it('shows the PDF-not-fillable note and upload only', () => {
    renderDialog('not-fillable', 'pdf');

    expect(screen.getByText(FILLED_TEMPLATE_PDF_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: BTN_UPLOAD_ONE_NOW })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: BTN_USE_SHARED_TEMPLATE })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
  });

  it('shows the non-fillable note for other attached file types', () => {
    renderDialog('not-fillable', 'other');

    expect(screen.getByText(FILLED_TEMPLATE_NOT_FILLABLE_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: BTN_UPLOAD_ONE_NOW })).toBeInTheDocument();
  });
});
