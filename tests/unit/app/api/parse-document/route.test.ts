/**
 * @jest-environment node
 */
const mockGetUser = jest.fn();
const mockUploadUpdate = jest.fn();
const mockUploadMaybeSingle = jest.fn();
const mockUserStorageDownload = jest.fn();
const mockAdminStorageDownload = jest.fn();
const mockParseUploadedFile = jest.fn();
const mockCreateAdminClient = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: mockUploadMaybeSingle,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: mockUploadUpdate,
        })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        download: mockUserStorageDownload,
      })),
    },
  })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}));

jest.mock('@/lib/parse/parse-uploaded-file', () => {
  const actual = jest.requireActual('@/lib/parse/parse-uploaded-file') as typeof import('@/lib/parse/parse-uploaded-file');
  return {
    ...actual,
    parseUploadedFile: (...args: unknown[]) => mockParseUploadedFile(...args),
  };
});

import { POST } from '@/app/api/parse-document/route';
import { UnsupportedFileTypeError } from '@/lib/parse/parse-uploaded-file';
import {
  DOCUMENT_STORAGE_READ_ERROR,
  TEMPLATE_STORAGE_READ_ERROR,
} from '@/lib/parse/storage-download';

function request(body: Record<string, unknown>) {
  return new Request('http://localhost/api/parse-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest;
}

function fileBlob(bytes = 'file-bytes') {
  return new Blob([bytes]);
}

describe('POST /api/parse-document', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockUserStorageDownload.mockResolvedValue({ data: fileBlob(), error: null });
    mockAdminStorageDownload.mockResolvedValue({ data: fileBlob(), error: null });
    mockCreateAdminClient.mockReturnValue({
      storage: {
        from: jest.fn(() => ({
          download: mockAdminStorageDownload,
        })),
      },
    });
    mockUploadUpdate.mockResolvedValue({ data: null, error: null });
    mockUploadMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it('returns 401 JSON when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(request({ storagePath: 'x.pdf' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
    expect(mockAdminStorageDownload).not.toHaveBeenCalled();
  });

  it('rejects a PDF template before downloading or parsing it', async () => {
    const res = await POST(
      request({
        storagePath: 'user-1/template/pr15-test.pdf',
        uploadId: 'upload-template',
        uploadType: 'template',
      }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'Lesson plan templates need to be .docx, .xlsx, or .xls so we can fill them in. You uploaded a .pdf.',
    });
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
    expect(mockAdminStorageDownload).not.toHaveBeenCalled();
    expect(mockUserStorageDownload).not.toHaveBeenCalled();
    expect(mockParseUploadedFile).not.toHaveBeenCalled();
  });

  it('rejects a PDF in a template storage path even without uploadType', async () => {
    const res = await POST(
      request({
        storagePath: 'user-1/template/pr15-test.pdf',
        uploadId: 'upload-template',
      }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'Lesson plan templates need to be .docx, .xlsx, or .xls so we can fill them in. You uploaded a .pdf.',
    });
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
    expect(mockAdminStorageDownload).not.toHaveBeenCalled();
    expect(mockUserStorageDownload).not.toHaveBeenCalled();
    expect(mockParseUploadedFile).not.toHaveBeenCalled();
  });

  it('downloads via the admin client after verifying the path belongs to the user', async () => {
    mockParseUploadedFile.mockResolvedValue({
      text: '',
      type: 'docx',
      metadata: { droppedRunCount: 0 },
    });
    const storagePath = 'user-1/template/Blank Daily English lesson plan template.docx';

    const res = await POST(
      request({
        storagePath,
        uploadId: 'upload-1',
        uploadType: 'template',
      }),
    );

    expect(res.status).toBe(200);
    expect(mockCreateAdminClient).toHaveBeenCalledTimes(1);
    expect(mockAdminStorageDownload).toHaveBeenCalledWith(storagePath);
    expect(mockUserStorageDownload).not.toHaveBeenCalled();
  });

  it('returns parsed JSON for a blank template without requiring extracted text', async () => {
    mockParseUploadedFile.mockResolvedValue({
      text: '',
      type: 'docx',
      metadata: { droppedRunCount: 0 },
    });

    const res = await POST(
      request({
        storagePath: 'user-1/template/Blank Daily English lesson plan template.docx',
        uploadId: 'upload-1',
        uploadType: 'template',
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      text: '',
      type: 'docx',
      metadata: { droppedRunCount: 0 },
      preview: '',
    });
    expect(mockUploadUpdate).toHaveBeenCalled();
  });

  it('returns 422 JSON when a curriculum PDF has no readable text', async () => {
    mockParseUploadedFile.mockResolvedValue({
      text: '   ',
      type: 'pdf',
      metadata: { pages: 1 },
    });

    const res = await POST(
      request({
        storagePath: 'user-1/curriculum_doc/unit.pdf',
        uploadId: 'upload-2',
        uploadType: 'curriculum_doc',
      }),
    );

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/No readable text/i);
  });

  it('returns 500 JSON with a useful error when the parser throws', async () => {
    mockParseUploadedFile.mockRejectedValue(new ReferenceError('DOMMatrix is not defined'));

    const res = await POST(
      request({
        storagePath: 'user-1/curriculum_doc/unit.pdf',
        uploadId: 'upload-3',
        uploadType: 'curriculum_doc',
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({
      error: expect.stringMatching(/Failed to read this PDF/i),
    });
    expect(typeof body.error).toBe('string');
  });

  it('returns 400 JSON for unsupported file types', async () => {
    mockParseUploadedFile.mockRejectedValue(new UnsupportedFileTypeError('bin'));

    const res = await POST(
      request({
        storagePath: 'user-1/curriculum_doc/notes.bin',
        uploadType: 'curriculum_doc',
      }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Unsupported file type: bin' });
  });

  it('returns 502 teacher copy when a template cannot be downloaded, without leaking storage errors', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAdminStorageDownload.mockResolvedValue({
      data: null,
      error: { message: 'Object not found', statusCode: '404' },
    });

    const res = await POST(
      request({
        storagePath: 'user-1/template/Blank Daily English lesson plan template.docx',
        uploadType: 'template',
      }),
    );

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).toEqual({ error: TEMPLATE_STORAGE_READ_ERROR });
    expect(JSON.stringify(body)).not.toMatch(/Object not found|Failed to download file/i);
    expect(consoleError).toHaveBeenCalled();
    expect(JSON.stringify(consoleError.mock.calls)).toMatch(/Object not found/);
    expect(JSON.stringify(consoleError.mock.calls)).toMatch(/404/);
    expect(mockUserStorageDownload).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('returns 502 teacher copy when a curriculum document cannot be downloaded', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAdminStorageDownload.mockResolvedValue({
      data: null,
      error: { message: 'missing', statusCode: 400 },
    });

    const res = await POST(
      request({
        storagePath: 'user-1/curriculum_doc/missing.pdf',
        uploadType: 'curriculum_doc',
      }),
    );

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: DOCUMENT_STORAGE_READ_ERROR });
    expect(res.status).not.toBe(404);
    consoleError.mockRestore();
  });

  it('returns 502 teacher copy when the admin client cannot be created', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateAdminClient.mockImplementation(() => {
      throw new Error('Supabase admin client is not configured');
    });

    const res = await POST(
      request({
        storagePath: 'user-1/template/plan.docx',
        uploadType: 'template',
      }),
    );

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: TEMPLATE_STORAGE_READ_ERROR });
    expect(JSON.stringify(consoleError.mock.calls)).toMatch(
      /Supabase admin client is not configured/,
    );
    consoleError.mockRestore();
  });

  it('allows download when an uploads row matches even without a user-id path prefix', async () => {
    mockParseUploadedFile.mockResolvedValue({
      text: '',
      type: 'docx',
      metadata: {},
    });
    mockUploadMaybeSingle.mockResolvedValue({
      data: { type: 'template', storage_path: 'legacy/blank.docx' },
      error: null,
    });

    const res = await POST(
      request({
        storagePath: 'legacy/blank.docx',
        uploadId: 'upload-legacy',
        uploadType: 'template',
      }),
    );

    expect(res.status).toBe(200);
    expect(mockAdminStorageDownload).toHaveBeenCalledWith('legacy/blank.docx');
    expect(mockUserStorageDownload).not.toHaveBeenCalled();
  });

  it('rejects another user path before the admin download', async () => {
    const res = await POST(
      request({
        storagePath: 'other-user/template/secret.docx',
        uploadType: 'template',
      }),
    );

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: TEMPLATE_STORAGE_READ_ERROR });
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
    expect(mockAdminStorageDownload).not.toHaveBeenCalled();
    expect(mockUserStorageDownload).not.toHaveBeenCalled();
  });
});
