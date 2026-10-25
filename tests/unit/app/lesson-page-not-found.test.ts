/**
 * @jest-environment node
 */
import { existsSync } from 'node:fs';
import path from 'node:path';

const mockGetUser = jest.fn();
const mockSingle = jest.fn();

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_HTTP_ERROR_FALLBACK;404');
  }),
}));

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

jest.mock('@/features/lesson/components/LessonView', () => ({
  LessonView: () => null,
}));

import { notFound } from 'next/navigation';
import LessonPage from '@/app/(app)/lesson/[id]/page';

describe('lesson page notFound status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  });

  it('calls notFound() when the lesson does not exist', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    await expect(
      Promise.resolve(LessonPage({ params: Promise.resolve({ id: 'missing' }) })),
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');

    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound() when the lesson is not owned by the current user', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'RLS or missing row' } });

    await expect(
      Promise.resolve(LessonPage({ params: Promise.resolve({ id: 'other-user-lesson' }) })),
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');

    expect(notFound).toHaveBeenCalled();
  });

  it('does not call notFound() when the lesson exists and is owned', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'lesson-1', user_id: 'user-1', title: 'Owned lesson' },
      error: null,
    });

    const result = await Promise.resolve(
      LessonPage({ params: Promise.resolve({ id: 'lesson-1' }) }),
    );

    expect(notFound).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it('does not ship a route loading.tsx that would stream HTTP 200 before notFound', () => {
    const loadingFile = path.join(
      process.cwd(),
      'app',
      '(app)',
      'lesson',
      '[id]',
      'loading.tsx',
    );
    expect(existsSync(loadingFile)).toBe(false);
  });
});

