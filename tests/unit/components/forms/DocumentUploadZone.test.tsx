import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
