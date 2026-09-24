/**
 * @jest-environment node
 */
const mockGetUser = jest.fn();
const mockLessonSingle = jest.fn();
const mockStorageDownload = jest.fn();
const mockFillGeneric = jest.fn();
const mockCreateReport = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockLessonSingle,
          })),
        })),
      })),
    })),
  })),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        download: mockStorageDownload,
      })),
    },
  })),
}));

jest.mock('@/lib/export/fill-generic-template', () => ({
  fillGenericDocxTemplate: (...args: unknown[]) => mockFillGeneric(...args),
}));

jest.mock('docx-templates', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockCreateReport(...args),
}));

jest.mock('xlsx', () => ({
  read: jest.fn(),
  write: jest.fn(),
}));

import { POST, buildTemplateData } from '@/app/api/export/fill-template/route';
import {
  TEMPLATE_UNFILLED_CODE,
  TEMPLATE_UNFILLED_ERROR,
} from '@/lib/export/fill-template-result';
import * as XLSX from 'xlsx';

const lessonContent = {
  title: 'Story Elements',
  essentialQuestion: 'What makes a story feel real?',
  objectives: ['Identify elements'],
  successCriteria: ['I can identify character and setting'],
  keyConcepts: ['character'],
  vocabulary: ['theme', 'conflict'],
  hook: 'Opening image prompt',
  mainActivities: ['Read a passage'],
  guidedPractice: ['Shared story map'],
  independentPractice: ['Individual annotation'],
  formativeAssessment: ['Exit ticket'],
  differentiation: {
    support: ['Sentence starters'],
    extension: ['Implicit theme analysis'],
  },
  realWorldConnections: ['Film storytelling'],
  plenary: 'Share learning',
};

function authUser() {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
}

function lessonRow(templatePath: string) {
  mockLessonSingle.mockResolvedValue({
    data: {
      id: 'lesson-1',
      title: 'Story Elements',
      content: lessonContent,
      template_path: templatePath,
      user_id: 'user-1',
    },
    error: null,
  });
}

async function makeDocxBuffer(documentXml: string): Promise<Buffer> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  zip.file('word/document.xml', documentXml);
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
  );
  return Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }));
}

function mockDownloadedBuffer(buffer: Buffer) {
  mockStorageDownload.mockResolvedValue({
    data: { arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) },
    error: null,
  });
}

function postFill(body: unknown = { lessonId: 'lesson-1' }) {
  return POST(
    new Request('http://localhost/api/export/fill-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
  );
}

describe('template fill data', () => {
  it('maps formal lesson fields to placeholders for uploaded templates', () => {
    const data = buildTemplateData(lessonContent);

    expect(data).toMatchObject({
      essentialQuestion: 'What makes a story feel real?',
      vocabulary: 'theme\nconflict',
    });
  });
});

describe('POST /api/export/fill-template', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authUser();
    lessonRow('user-1/template/plan.docx');
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });

    const response = await postFill();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when lessonId is missing', async () => {
    const response = await postFill({});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'lessonId is required' });
  });

  it('returns 422 and no file when generic DOCX fill matches nothing', async () => {
    const templateBuffer = await makeDocxBuffer(
      '<?xml version="1.0"?><w:document><w:body><w:p><w:r><w:t>Blank form</w:t></w:r></w:p></w:body></w:document>',
    );
    mockDownloadedBuffer(templateBuffer);
    mockFillGeneric.mockResolvedValue({
      buffer: templateBuffer,
      filledCount: 0,
      matchedLabels: [],
    });

    const response = await postFill();

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: TEMPLATE_UNFILLED_ERROR,
      code: TEMPLATE_UNFILLED_CODE,
    });
    expect(mockFillGeneric).toHaveBeenCalled();
  });

  it('returns 422 when the only fill is the hardcoded Materials default', async () => {
    const templateBuffer = await makeDocxBuffer(
      '<?xml version="1.0"?><w:document><w:body><w:tbl></w:tbl></w:body></w:document>',
    );
    mockDownloadedBuffer(templateBuffer);
    mockFillGeneric.mockResolvedValue({
      buffer: templateBuffer,
      filledCount: 1,
      matchedLabels: ['materials'],
    });

    const response = await postFill();

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: TEMPLATE_UNFILLED_ERROR,
      code: TEMPLATE_UNFILLED_CODE,
    });
  });

  it('returns 422 when a +++ DOCX template is unchanged and contains no lesson text', async () => {
    const xml =
      '<?xml version="1.0"?><w:document><w:body><w:p><w:r><w:t>+++unknownField+++</w:t></w:r></w:p></w:body></w:document>';
    const templateBuffer = await makeDocxBuffer(xml);
    mockDownloadedBuffer(templateBuffer);
    mockCreateReport.mockResolvedValue(templateBuffer);

    const response = await postFill();

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: TEMPLATE_UNFILLED_ERROR,
      code: TEMPLATE_UNFILLED_CODE,
    });
    expect(mockFillGeneric).not.toHaveBeenCalled();
  });

  it('returns 422 when an XLSX template has no matching placeholders', async () => {
    lessonRow('user-1/template/plan.xlsx');
    mockDownloadedBuffer(Buffer.from('xlsx'));
    (XLSX.read as jest.Mock).mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: {
          A1: { t: 's', v: 'Date' },
        },
      },
    });

    const response = await postFill();

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: TEMPLATE_UNFILLED_ERROR,
      code: TEMPLATE_UNFILLED_CODE,
    });
    expect(XLSX.write).not.toHaveBeenCalled();
  });

  it('returns the filled DOCX when generic fill writes lesson fields', async () => {
    const templateBuffer = await makeDocxBuffer(
      '<?xml version="1.0"?><w:document><w:body><w:tbl></w:tbl></w:body></w:document>',
    );
    const filledBuffer = await makeDocxBuffer(
      '<?xml version="1.0"?><w:document><w:body><w:p><w:r><w:t>Identify elements</w:t></w:r></w:p></w:body></w:document>',
    );
    mockDownloadedBuffer(templateBuffer);
    mockFillGeneric.mockResolvedValue({
      buffer: filledBuffer,
      filledCount: 2,
      matchedLabels: ['objectives', 'hook'],
    });

    const response = await postFill();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(response.headers.get('Content-Disposition')).toContain('Story Elements-filled.docx');
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(bytes.equals(filledBuffer)).toBe(true);
  });
});
