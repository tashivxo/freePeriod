/**
 * @jest-environment node
 */
const mockGetUser = jest.fn();
const mockLessonSingle = jest.fn();
const mockAdminUpdateSingle = jest.fn();

const lessonSelectChain: Record<string, jest.Mock> = {};
lessonSelectChain.select = jest.fn(() => lessonSelectChain);
lessonSelectChain.eq = jest.fn(() => lessonSelectChain);
lessonSelectChain.single = jest.fn(() => mockLessonSingle());

const lessonUpdateChain: Record<string, jest.Mock> = {};
lessonUpdateChain.update = jest.fn(() => lessonUpdateChain);
lessonUpdateChain.eq = jest.fn(() => lessonUpdateChain);
lessonUpdateChain.select = jest.fn(() => lessonUpdateChain);
lessonUpdateChain.single = jest.fn(() => mockAdminUpdateSingle());

const mockAdminFrom = jest.fn((table: string) => {
  if (table === 'lesson_plans') return lessonUpdateChain;
  return lessonSelectChain;
});

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => lessonSelectChain),
  })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: mockAdminFrom,
  })),
}));

import { PATCH } from '@/app/api/lessons/[id]/title/route';
import { LESSON_TITLE_MAX_LENGTH } from '@/lib/lesson/title';

function request(body: unknown) {
  return new Request('http://localhost/api/lessons/lesson-1/title', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/lessons/[id]/title', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockLessonSingle.mockResolvedValue({ data: { id: 'lesson-1' }, error: null });
    mockAdminUpdateSingle.mockResolvedValue({
      data: { id: 'lesson-1', title: 'Ratios', updated_at: '2026-03-01T00:00:00.000Z' },
      error: null,
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await PATCH(request({ title: 'Ratios' }) as never, {
      params: Promise.resolve({ id: 'lesson-1' }),
    });
    expect(response.status).toBe(401);
  });

  it('returns 404 when the lesson is not owned by the user', async () => {
    mockLessonSingle.mockResolvedValue({ data: null, error: { message: 'nf' } });
    const response = await PATCH(request({ title: 'Ratios' }) as never, {
      params: Promise.resolve({ id: 'lesson-1' }),
    });
    expect(response.status).toBe(404);
    expect(mockAdminUpdateSingle).not.toHaveBeenCalled();
  });

  it('returns 400 for blank titles', async () => {
    const response = await PATCH(request({ title: '   ' }) as never, {
      params: Promise.resolve({ id: 'lesson-1' }),
    });
    expect(response.status).toBe(400);
    expect(mockAdminUpdateSingle).not.toHaveBeenCalled();
  });

  it('renames with a trimmed title and only updates title and updated_at', async () => {
    const response = await PATCH(request({ title: '  Ratios  ' }) as never, {
      params: Promise.resolve({ id: 'lesson-1' }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.lesson.title).toBe('Ratios');

    expect(lessonUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ratios',
        updated_at: expect.any(String),
      }),
    );
    const updatePayload = lessonUpdateChain.update.mock.calls[0]![0] as Record<string, unknown>;
    expect(Object.keys(updatePayload).sort()).toEqual(['title', 'updated_at']);
  });

  it('accepts Arabic titles', async () => {
    mockAdminUpdateSingle.mockResolvedValue({
      data: { id: 'lesson-1', title: 'الكسور', updated_at: '2026-03-01T00:00:00.000Z' },
      error: null,
    });
    const response = await PATCH(request({ title: 'الكسور' }) as never, {
      params: Promise.resolve({ id: 'lesson-1' }),
    });
    expect(response.status).toBe(200);
    expect(lessonUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'الكسور' }),
    );
  });

  it('truncates overlong titles before persisting', async () => {
    const long = 'x'.repeat(LESSON_TITLE_MAX_LENGTH + 10);
    const response = await PATCH(request({ title: long }) as never, {
      params: Promise.resolve({ id: 'lesson-1' }),
    });
    expect(response.status).toBe(200);
    expect(lessonUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'x'.repeat(LESSON_TITLE_MAX_LENGTH) }),
    );
  });
});