/**
 * @jest-environment node
 */
const mockGetUser = jest.fn();
const mockUploadUpdate = jest.fn();
const mockUploadMaybeSingle = jest.fn();
const mockStorageDownload = jest.fn();
const mockParseUploadedFile = jest.fn();

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
        download: mockStorageDownload,
      })),
    },
  })),
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
    mockStorageDownload.mockResolvedValue({ data: fileBlob(), error: null });
    mockUploadUpdate.mockResolvedValue({ data: null, error: null });
    mockUploadMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it('returns 401 JSON when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(request({ storagePath: 'x.pdf' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
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

  it('returns 404 JSON when the file cannot be downloaded', async () => {
    mockStorageDownload.mockResolvedValue({ data: null, error: { message: 'missing' } });

    const res = await POST(
      request({
        storagePath: 'user-1/curriculum_doc/missing.pdf',
        uploadType: 'curriculum_doc',
      }),
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Failed to download file' });
  });
});
