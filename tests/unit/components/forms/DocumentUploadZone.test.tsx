import type { ComponentProps } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentUploadZone } from '@/components/forms/DocumentUploadZone';

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
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
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

describe('DocumentUploadZone template intake', () => {
  const onUploadComplete = jest.fn();
  const onRemove = jest.fn();
  const onBusyChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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
    render(
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
    render(
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
      'Lesson plan templates need to be .pdf, .docx, .xlsx, or .xls so we can fill them in. You uploaded a .txt.',
    );
    expect(screen.queryByText(/notes\.txt/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reading document/i)).not.toBeInTheDocument();
    expect(onBusyChange).not.toHaveBeenCalledWith(true);
    expect(mockUpload).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(onUploadComplete).not.toHaveBeenCalled();
  });

  it('still accepts a DOCX template', async () => {
    render(
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
  ) {
    return render(
      <DocumentUploadZone
        label="Upload lesson plan template"
        accept=".pdf,.docx,.xlsx,.xls"
        uploadType="template"
        onUploadComplete={onUploadComplete}
        onRemove={onRemove}
        onBusyChange={onBusyChange}
        {...props}
      />,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('highlights the drop zone while dragging and uploads a dropped file', async () => {
    renderZone();

    const dropzone = screen.getByText(/drag and drop a file here/i).closest('[data-dragging]');
    expect(dropzone).toHaveAttribute('data-dragging', 'false');

    fireEvent.dragEnter(dropzone!, { dataTransfer: { types: ['Files'] } });
    expect(dropzone).toHaveAttribute('data-dragging', 'true');

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

  it('rejects an oversized file with an error and does not upload', async () => {
    const user = userEvent.setup();
    renderZone({ maxSizeBytes: 10 });

    const file = new File(['%PDF-1.7 extra'], 'huge.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/upload lesson plan template/i), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'huge.pdf exceeds the maximum size of 10 B',
    );
    expect(screen.queryByText('huge.pdf')).not.toBeInTheDocument();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('rejects a zero-byte file with an error', async () => {
    const user = userEvent.setup();
    renderZone();

    const file = new File([], 'empty.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/upload lesson plan template/i), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'empty.pdf is empty. Please choose a file with content.',
    );
    expect(mockUpload).not.toHaveBeenCalled();
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

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be processed/i);
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
});

