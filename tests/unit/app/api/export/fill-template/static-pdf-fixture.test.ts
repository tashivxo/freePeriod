/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const mockGetUser = jest.fn();
const mockLessonSingle = jest.fn();
const mockStorageDownload = jest.fn();

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

import { POST } from '@/app/api/export/fill-template/route';
import { FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL } from '@/lib/export/copy';
import { TEMPLATE_UNFILLED_CODE } from '@/lib/export/fill-template-result';

const STATIC_FORMAL_FIXTURE = readFileSync(
  path.join(process.cwd(), 'tests/fixtures/static-formal-lesson-plan.pdf'),
);

const PDF_NO_FIELDS_ERROR = `Couldn’t fill this PDF, it has no fillable form fields. Upload a Word (.docx) version of your template, or use ${FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL} for a Free Period lesson plan.`;

const lessonContent = {
  title: 'Story Elements',
  essentialQuestion: 'What makes a story feel real?',
  objectives: ['Identify elements'],
  successCriteria: ['I can identify character and setting'],
  vocabulary: ['theme'],
  hook: 'Opening image prompt',
  mainActivities: ['Read a passage'],
  guidedPractice: ['Shared story map'],
  independentPractice: ['Individual annotation'],
  formativeAssessment: ['Exit ticket'],
  differentiation: { support: ['Sentence starters'], extension: ['Implicit theme analysis'] },
  realWorldConnections: ['Film storytelling'],
  plenary: 'Share learning',
};

function mockDownloadedBuffer(buffer: Buffer) {
  mockStorageDownload.mockResolvedValue({
    data: {
      arrayBuffer: async () =>
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    },
    error: null,
  });
}

describe('POST /api/export/fill-template with static Formal PDF fixture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockLessonSingle.mockResolvedValue({
      data: {
        id: 'lesson-1',
        title: 'Story Elements',
        content: lessonContent,
        template_path: 'user-1/template/static-formal-lesson-plan.pdf',
        user_id: 'user-1',
      },
      error: null,
    });
  });

  it('returns no-fields 422 copy built from the download-label constant', async () => {
    mockDownloadedBuffer(STATIC_FORMAL_FIXTURE);

    const response = await POST(
      new Request('http://localhost/api/export/fill-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: 'lesson-1' }),
      }) as never,
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: PDF_NO_FIELDS_ERROR,
      code: TEMPLATE_UNFILLED_CODE,
    });
  });
});
