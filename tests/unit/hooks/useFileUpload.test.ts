/** @jest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import { useFileUpload } from '@/hooks/useFileUpload';

const mockUpload = jest.fn();
const mockRemove = jest.fn();
const mockInsertSingle = jest.fn();
const mockDeleteEq = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      insert: () => ({
        select: () => ({
          single: mockInsertSingle,
        }),
      }),
      delete: () => ({
        eq: mockDeleteEq,
      }),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
      })),
    },
  })),
}));

function pdfFile(name = 'unit.pdf') {
  return new File(['%PDF-1.4 content'], name, { type: 'application/pdf' });
}

function templateFile(name = 'blank.docx') {
  return new File(['PK'], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

describe('useFileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpload.mockResolvedValue({ data: { path: 'ok' }, error: null });
    mockInsertSingle.mockResolvedValue({ data: { id: 'upload-1' }, error: null });
    mockRemove.mockResolvedValue({ data: null, error: null });
    mockDeleteEq.mockResolvedValue({ data: null, error: null });
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Extracted curriculum' }),
    });
  });

  it('retries parse for the same file instead of inserting another uploads row', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'The document could not be processed.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'Extracted curriculum' }),
      });

    const { result } = renderHook(() =>
      useFileUpload({ uploadType: 'curriculum_doc', accept: '.pdf' }),
    );
    const file = pdfFile();

    await act(async () => {
      await result.current.handleFile(file);
    });

    expect(result.current.error).toMatch(/could not be processed/i);
    expect(result.current.storagePath).toBeNull();
    expect(result.current.file?.name).toBe('unit.pdf');
    expect(mockInsertSingle).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.handleFile(file);
    });

    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockInsertSingle).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe('ready');
    expect(result.current.storagePath).toMatch(/curriculum_doc\/unit-/);
    expect(result.current.error).toBeNull();
  });

  it('treats a blank template as a successful upload', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ text: '' }),
    });

    const { result } = renderHook(() =>
      useFileUpload({ uploadType: 'template', accept: '.docx' }),
    );

    await act(async () => {
      await result.current.handleFile(templateFile());
    });

    expect(result.current.phase).toBe('ready');
    expect(result.current.error).toBeNull();
    expect(result.current.storagePath).toMatch(/template\/blank-/);
  });

  it('keeps a failed curriculum file visible and does not mark it ready', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ text: '   ' }),
    });

    const { result } = renderHook(() =>
      useFileUpload({ uploadType: 'curriculum_doc', accept: '.pdf' }),
    );

    await act(async () => {
      await result.current.handleFile(pdfFile());
    });

    expect(result.current.file?.name).toBe('unit.pdf');
    expect(result.current.phase).toBe('error');
    expect(result.current.storagePath).toBeNull();
    expect(result.current.error).toMatch(/no readable text/i);
  });
});
