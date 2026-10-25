/**
 * @jest-environment node
 */

const mockGetUser = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: () => {
      const query: Record<string, unknown> = {};
      query.select = jest.fn(() => query);
      query.eq = jest.fn(() => query);
      query.single = mockSingle;
      return query;
    },
  })),
}));

import { getMessages, LOCALES } from '@/lib/i18n';
import { resolveOwnedLessonPage } from '@/lib/lesson/resolve-lesson-page';

const MISSING_IDS = ['not-a-real-id', '00000000-0000-4000-8000-000000000000'] as const;

describe('resolveOwnedLessonPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  });

  it.each(MISSING_IDS)('returns HTTP 404 and the localized not-found title for %s', async (id) => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const resolved = await resolveOwnedLessonPage(id, 'en');

    expect(resolved.status).toBe(404);
    expect(resolved.title).toBe(getMessages('en').status.notFoundDocumentTitle);
    expect(resolved.title).not.toBe('Lesson | FreePeriod');
    expect('lesson' in resolved && resolved.lesson).toBeFalsy();
  });

  it.each(LOCALES)('uses the %s not-found document title on a missing lesson', async (locale) => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const resolved = await resolveOwnedLessonPage('not-a-real-id', locale);

    expect(resolved).toEqual({
      status: 404,
      title: getMessages(locale).status.notFoundDocumentTitle,
    });
  });

  it('returns HTTP 200 and the lesson title when the plan exists and is owned', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'lesson-1',
        user_id: 'user-1',
        title: 'Photosynthesis',
        content: { title: 'Photosynthesis' },
      },
      error: null,
    });

    const resolved = await resolveOwnedLessonPage('lesson-1', 'en');

    expect(resolved.status).toBe(200);
    expect(resolved.title).toBe('Photosynthesis | FreePeriod');
    if (resolved.status !== 200) throw new Error('expected a found lesson');
    expect(resolved.lesson.id).toBe('lesson-1');
  });
});
