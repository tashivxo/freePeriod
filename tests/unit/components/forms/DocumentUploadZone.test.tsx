import type { ComponentProps, ReactElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DocumentUploadZone,
  UPLOAD_ACTION_COLOR_DARK,
  UPLOAD_ACTION_COLOR_LIGHT,
  UPLOAD_DRAG_BACKGROUND,
  UPLOAD_DRAG_BORDER,
  classifyUploadError,
} from '@/components/forms/DocumentUploadZone';
import { contrastRatio } from '@/tests/helpers/contrast';
import { getMessages, LOCALES } from '@/lib/i18n';
import { LocaleProvider } from '@/providers/locale';

const mockGetUser = jest.fn();
const mockUpload = jest.fn().mockResolvedValue({
  data: { path: 'user-123/template/plan.docx' },
  error: null,
});
const mockRemove = jest.fn().mockResolvedValue({ data: null, error: null });
const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'upload-123' }, error: null });
const mockSelectChain = jest.fn(() => ({ single: mockSingle }));
const mockDbInsert = jest.fn(() => ({ select: mockSelectChain }));
const mockFromDb = jest.fn(() => ({ insert: mockDbInsert }));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
    from: mockFromDb,
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
      })),
    },
  })),
}));

jest.mock('@/providers/zen-mode', () => ({
  useZenMode: () => ({ zenMode: true }),
}));

function renderWithLocale(ui: ReactElement, locale: 'en' | 'ar' | 'es' | 'fr' | 'zh-Hans' = 'en') {
  return render(<LocaleProvider initialLocale={locale}>{ui}</LocaleProvider>);
}

describe('classifyUploadError', () => {
  it('maps auth failures, never treating them as generic copy', () => {
    expect(classifyUploadError('Not authenticated')).toBe('auth');
    expect(classifyUploadError('JWT expired')).toBe('auth');
    expect(classifyUploadError('Auth session missing')).toBe('auth');
  });

  it('maps oversized and wrong-type files', () => {
    expect(classifyUploadError('huge.pdf exceeds the maximum size of 10 B')).toBe('tooLarge');
    expect(classifyUploadError('Payload too large')).toBe('tooLarge');
    expect(classifyUploadError('Only .pdf files are accepted. You uploaded a .txt file.')).toBe(
      'wrongType',
    );
    expect(
      classifyUploadError(
        'Lesson plan templates need to be .pdf, .docx, .xlsx, or .xls so we can fill them in. You uploaded a .txt.',
      ),
    ).toBe('wrongType');
  });

  it('maps empty files and network failures', () => {
    expect(classifyUploadError('empty.pdf is empty. Please choose a file with content.')).toBe(
      'empty',
    );
    expect(classifyUploadError('Failed to fetch')).toBe('network');
    expect(classifyUploadError('NetworkError when attempting to fetch resource.')).toBe('network');
    expect(classifyUploadError('Upload failed')).toBe('network');
  });

  it('falls back to generic for unknown raw messages', () => {
    expect(classifyUploadError('duplicate key value violates unique constraint')).toBe('generic');
    expect(classifyUploadError('The document could not be processed.')).toBe('generic');
  });
});

describe('DocumentUploadZone action contrast', () => {
  it('uses a darker coral that meets WCAG AA on white, and brand coral on dark surfaces', () => {
    // Light: #B5486F is a darkened coral-800, 5.10:1 on white (AA for text is 4.5:1).
    // Brand coral-500 #FF8BB0 is only 2.19:1 on white and cannot be used for links.
    const lightOnWhite = contrastRatio(UPLOAD_ACTION_COLOR_LIGHT, '#FFFFFF');
    const lightOnCream = contrastRatio(UPLOAD_ACTION_COLOR_LIGHT, '#FFFBF7');
    const darkOnNearBlack = contrastRatio(UPLOAD_ACTION_COLOR_DARK, '#171717');
    const darkOnCard = contrastRatio(UPLOAD_ACTION_COLOR_DARK, '#2C2C2C');

    expect(UPLOAD_ACTION_COLOR_LIGHT).toBe('#B5486F');
    expect(UPLOAD_ACTION_COLOR_DARK).toBe('#FF8BB0');
    expect(lightOnWhite).toBeGreaterThanOrEqual(4.5);
    expect(lightOnCream).toBeGreaterThanOrEqual(4.5);
    expect(darkOnNearBlack).toBeGreaterThanOrEqual(4.5);
    expect(darkOnCard).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#FF8BB0', '#FFFFFF')).toBeLessThan(4.5);
  });
});

describe('DocumentUploadZone template intake', () => {
  const onUploadComplete = jest.fn();
  const onRemove = jest.fn();
  const onBusyChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockUpload.mockResolvedValue({
      data: { path: 'user-123/template/plan.docx' },
      error: null,
    });
    (global as { fetch: unknown }).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: '' }),
    });
  });

  it('accepts a PDF template and uploads it', async () => {
    renderWithLocale(
      <DocumentUploadZone
        label="Upload lesson plan template"
        accept=".pdf,.docx,.xlsx,.xls"
        uploadType="template"
        onUploadComplete={onUploadComplete}
        onRemove={onRemove}
        onBusyChange={onBusyChange}
      />,
    );

    const file = new File(['%PDF-1.7'], 'pr15-test.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText(/upload lesson plan template/i), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText('pr15-test.pdf')).toBeInTheDocument();
      expect(screen.getByText(/uploaded\. ready to generate/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mockUpload).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
    expect(onUploadComplete).toHaveBeenCalled();
  });

  it('still rejects a plain-text file before reading, uploading, or marking the parent busy', async () => {
    renderWithLocale(
      <DocumentUploadZone
        label="Upload lesson plan template"
        accept=".pdf,.docx,.xlsx,.xls"
        uploadType="template"
        onUploadComplete={onUploadComplete}
        onRemove={onRemove}
        onBusyChange={onBusyChange}
      />,
    );

    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText(/upload lesson plan template/i), {
      target: { files: [file] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This file type is not supported. Please choose a different file.',
    );
    expect(screen.queryByText(/notes\.txt/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reading document/i)).not.toBeInTheDocument();
    expect(onBusyChange).not.toHaveBeenCalledWith(true);
    expect(mockUpload).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(onUploadComplete).not.toHaveBeenCalled();
  });

  it('still accepts a DOCX template', async () => {
    renderWithLocale(
      <DocumentUploadZone
        label="Upload lesson plan template"
        accept=".pdf,.docx,.xlsx,.xls"
        uploadType="template"
        onUploadComplete={onUploadComplete}
        onRemove={onRemove}
        onBusyChange={onBusyChange}
      />,
    );

    const file = new File(['PK'], 'plan.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    fireEvent.change(screen.getByLabelText(/upload lesson plan template/i), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText('plan.docx')).toBeInTheDocument();
      expect(screen.getByText(/uploaded\. ready to generate/i)).toBeInTheDocument();
    });
    expect(mockUpload).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
  });
});

function dropFiles(target: Element, files: File[]) {
  fireEvent.drop(target, {
    dataTransfer: {
      files,
      items: files.map((file) => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file,
      })),
      types: ['Files'],
    },
  });
}

describe('DocumentUploadZone file input UX', () => {
  const onUploadComplete = jest.fn();
  const onRemove = jest.fn();
  const onBusyChange = jest.fn();

  function renderZone(
    props: Partial<ComponentProps<typeof DocumentUploadZone>> = {},
    locale: 'en' | 'ar' | 'es' | 'fr' | 'zh-Hans' = 'en',
  ) {
    return renderWithLocale(
      <DocumentUploadZone
        label="Upload lesson plan template"
        accept=".pdf,.docx,.xlsx,.xls"
        uploadType="template"
        onUploadComplete={onUploadComplete}
        onRemove={onRemove}
        onBusyChange={onBusyChange}
        {...props}
      />,
      locale,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockUpload.mockResolvedValue({
      data: { path: 'user-123/template/plan.docx' },
      error: null,
    });
    (global as { fetch: unknown }).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: '' }),
    });
  });

  it('shows browse instructions, accepted types, and the max size', () => {
    renderZone();

    expect(screen.getByText(/drag and drop a file here, or/i)).toBeInTheDocument();
    expect(screen.getByText('browse')).toBeInTheDocument();
    expect(screen.getByText('PDF, DOCX, XLSX, XLS · Max 10 MB')).toBeInTheDocument();
    expect(screen.getByLabelText(/upload lesson plan template/i)).toHaveAttribute(
      'aria-describedby',
    );
  });

  it('styles browse and Retry with the AA coral in light mode and brand coral in dark mode', async () => {
    const user = userEvent.setup();
    renderZone();

    const browse = screen.getByText('browse');
    expect(browse).toHaveClass('text-[#B5486F]');
    expect(browse).toHaveClass('dark:text-[#FF8BB0]');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'The document could not be processed.' }),
    });

    const file = new File(['%PDF-1.7'], 'retry.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/upload lesson plan template/i), file);

    const retry = await screen.findByRole('button', { name: /retry upload of retry\.pdf/i });
    expect(retry).toHaveClass('text-[#B5486F]');
    expect(retry).toHaveClass('dark:text-[#FF8BB0]');
  });

  it('highlights the drop zone with a solid 2px coral border and a stronger coral tint', async () => {
    renderZone();

    const dropzone = screen.getByText(/drag and drop a file here/i).closest('[data-dragging]');
    expect(dropzone).toHaveAttribute('data-dragging', 'false');
    expect((dropzone as HTMLElement).style.borderColor).not.toBe(UPLOAD_DRAG_BORDER);

    fireEvent.dragEnter(dropzone!, { dataTransfer: { types: ['Files'] } });
    expect(dropzone).toHaveAttribute('data-dragging', 'true');
    expect(dropzone).toHaveClass('border-solid');
    expect(dropzone).toHaveClass('border-2');
    expect((dropzone as HTMLElement).style.borderWidth).toBe('2px');
    expect((dropzone as HTMLElement).style.borderColor).toBe(UPLOAD_DRAG_BORDER);
    expect((dropzone as HTMLElement).style.backgroundColor).toBe(UPLOAD_DRAG_BACKGROUND);

    fireEvent.dragLeave(dropzone!);
    expect(dropzone).toHaveAttribute('data-dragging', 'false');

    fireEvent.dragEnter(dropzone!, { dataTransfer: { types: ['Files'] } });
    const file = new File(['%PDF-1.7'], 'dropped.pdf', { type: 'application/pdf' });
    dropFiles(dropzone!, [file]);

    expect(dropzone).toHaveAttribute('data-dragging', 'false');
    await waitFor(() => {
      expect(screen.getByText('dropped.pdf')).toBeInTheDocument();
      expect(screen.getByText(/uploaded\. ready to generate/i)).toBeInTheDocument();
    });
    expect(mockUpload).toHaveBeenCalled();
    expect(onUploadComplete).toHaveBeenCalled();
  });

  it('rejects an oversized file with friendly copy and does not upload', async () => {
    const user = userEvent.setup();
    renderZone({ maxSizeBytes: 10 });

    const file = new File(['%PDF-1.7 extra'], 'huge.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/upload lesson plan template/i), file);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'This file is too large. Please choose a smaller file.',
    );
    expect(alert).not.toHaveTextContent('huge.pdf exceeds the maximum size');
    expect(screen.queryByText('huge.pdf')).not.toBeInTheDocument();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('rejects a zero-byte file with friendly copy', async () => {
    const user = userEvent.setup();
    renderZone();

    const file = new File([], 'empty.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/upload lesson plan template/i), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This file is empty. Please choose a file with content.',
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('maps auth failures to sign-in copy instead of raw Not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const user = userEvent.setup();
    renderZone();

    const file = new File(['%PDF-1.7'], 'plan.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/upload lesson plan template/i), file);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Please sign in again to upload.');
    expect(alert).not.toHaveTextContent('Not authenticated');
  });

  it('maps network failures to connection copy instead of Failed to fetch', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    renderZone();

    const file = new File(['%PDF-1.7'], 'plan.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/upload lesson plan template/i), file);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Upload failed. Check your connection and try again.',
    );
    expect(alert).not.toHaveTextContent('Failed to fetch');
  });

  it('maps unknown upload errors to the generic fallback', async () => {
    mockUpload.mockResolvedValue({
      data: null,
      error: { message: 'duplicate key value violates unique constraint' },
    });
    const user = userEvent.setup();
    renderZone();

    const file = new File(['%PDF-1.7'], 'plan.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/upload lesson plan template/i), file);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn't upload this file. Please try again.");
    expect(alert).not.toHaveTextContent('duplicate key');
  });

  it('shows the file size, a progress bar while uploading, and a Remove label', async () => {
    let releaseUpload!: (value: { data: { path: string }; error: null }) => void;
    mockUpload.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseUpload = resolve;
        }),
    );

    const user = userEvent.setup();
    renderZone();

    const file = new File(['hello world'], 'plan.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    await user.upload(screen.getByLabelText(/upload lesson plan template/i), file);

    expect(await screen.findByText('11 B')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /uploading plan\.docx/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove plan.docx' })).toBeInTheDocument();

    releaseUpload({ data: { path: 'user-123/template/plan.docx' }, error: null });

    await waitFor(() => {
      expect(screen.getByText(/uploaded\. ready to generate/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('retries a failed upload without requiring the file to be chosen again', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'The document could not be processed.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: '' }),
      });

    const user = userEvent.setup();
    renderZone();

    const file = new File(['%PDF-1.7'], 'retry.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/upload lesson plan template/i), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /couldn't upload this file/i,
    );
    await user.click(screen.getByRole('button', { name: /retry upload of retry\.pdf/i }));

    await waitFor(() => {
      expect(screen.getByText(/uploaded\. ready to generate/i)).toBeInTheDocument();
    });
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps the current file when the file dialog is cancelled', async () => {
    const user = userEvent.setup();
    renderZone();

    const file = new File(['%PDF-1.7'], 'keep.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/upload lesson plan template/i), file);

    await waitFor(() => {
      expect(screen.getByText('keep.pdf')).toBeInTheDocument();
      expect(screen.getByText(/uploaded\. ready to generate/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/upload lesson plan template/i), {
      target: { files: [] },
    });

    expect(screen.getByText('keep.pdf')).toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('renders Arabic upload copy from the locale files', () => {
    const ar = getMessages('ar').generate.upload;
    renderZone({}, 'ar');
    expect(screen.getByText(ar.browse)).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes(ar.dragDropPrompt)),
    ).toBeInTheDocument();
  });
});
