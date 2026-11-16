/**
 * @jest-environment node
 */
const mockGetUser = jest.fn();
const mockLessonSingle = jest.fn();
const mockBuildLessonShareFile = jest.fn();
const mockAdminFrom = jest.fn();
const mockStorageUpload = jest.fn();

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

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: mockAdminFrom,
    storage: {
      from: jest.fn(() => ({
        upload: mockStorageUpload,
      })),
    },
  })),
}));

jest.mock('@/lib/share/build-lesson-share-file', () => ({
  buildLessonShareFile: (...args: unknown[]) => mockBuildLessonShareFile(...args),
  lessonShareStoragePath: (userId: string, lessonId: string, ext: string) =>
    `shares/${userId}/${lessonId}.${ext}`,
}));

jest.mock('@/lib/share/token', () => ({
  generateShareToken: () => 'new-token-abc',
}));

import { POST } from '@/app/api/lessons/[id]/share/route';

const lesson = {
  id: 'lesson-1',
  user_id: 'user-1',
  title: 'Fractions',
  subject: 'Math',
  grade: '8',
  curriculum: null,
  duration_minutes: 45,
  content: { title: 'Fractions', objectives: ['x'] },
  model_used: 'gemini',
  token_count: 1,
  template_path: null,
  created_at: '',
  updated_at: '',
};

function request() {
  return new Request('http://localhost/api/lessons/lesson-1/share', {
    method: 'POST',
    headers: { host: 'localhost' },
  });
}

describe('POST /api/lessons/[id]/share', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockLessonSingle.mockResolvedValue({ data: lesson, error: null });
    mockBuildLessonShareFile.mockResolvedValue({
      buffer: Buffer.from('file'),
      fileName: 'math.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      storageExt: 'docx',
      usedDocxFallback: false,
    });
    mockStorageUpload.mockResolvedValue({ error: null });

    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const eqToken = jest.fn(() => ({ maybeSingle }));
    const eqLesson = jest.fn(() => ({ maybeSingle }));
    const selectExisting = jest.fn(() => ({ eq: eqLesson }));
    const upsert = jest.fn().mockResolvedValue({ error: null });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'lesson_shares') {
        return {
          select: selectExisting,
          eq: eqLesson,
          upsert,
          maybeSingle,
        };
      }
      return { select: jest.fn(), eq: eqToken };
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await POST(request() as never, { params: Promise.resolve({ id: 'lesson-1' }) });
    expect(response.status).toBe(401);
  });

  it('returns 404 when lesson is not owned', async () => {
    mockLessonSingle.mockResolvedValue({ data: null, error: { message: 'nf' } });
    const response = await POST(request() as never, { params: Promise.resolve({ id: 'lesson-1' }) });
    expect(response.status).toBe(404);
  });

  it('creates share payload with a public URL', async () => {
    const response = await POST(request() as never, { params: Promise.resolve({ id: 'lesson-1' }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.token).toBe('new-token-abc');
    expect(body.url).toContain('/s/new-token-abc');
    expect(body.fileName).toBe('math.docx');
  });
});