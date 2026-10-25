/**
 * @jest-environment node
 */

const mockGetUser = jest.fn();
const mockSingle = jest.fn();

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    const error = new Error('NEXT_HTTP_ERROR_FALLBACK;404');
    (error as Error & { digest?: string }).digest = 'NEXT_HTTP_ERROR_FALLBACK;404';
    throw error;
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
import { generateMetadata } from '@/app/(app)/lesson/[id]/page';
import { getMessages } from '@/lib/i18n';

const EM_DASH = '\u2014';

describe('lesson page document title', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  });

  it('uses the lesson title with a pipe separator: "<title> | FreePeriod"', async () => {
    mockSingle.mockResolvedValue({
      data: { title: 'Photosynthesis', content: { title: 'Photosynthesis' } },
      error: null,
    });

    await expect(
      generateMetadata({ params: Promise.resolve({ id: 'lesson-1' }) }),
    ).resolves.toEqual(expect.objectContaining({ title: 'Photosynthesis | FreePeriod' }));
  });

  it('prefers content.title over the lesson row title', async () => {
    mockSingle.mockResolvedValue({
      data: { title: 'Row title', content: { title: 'Content title' } },
      error: null,
    });

    await expect(
      generateMetadata({ params: Promise.resolve({ id: 'lesson-1' }) }),
    ).resolves.toEqual(expect.objectContaining({ title: 'Content title | FreePeriod' }));
  });

  it('falls back to the row title when content.title is empty', async () => {
    mockSingle.mockResolvedValue({
      data: { title: 'Row title', content: { title: '   ' } },
      error: null,
    });

    await expect(
      generateMetadata({ params: Promise.resolve({ id: 'lesson-1' }) }),
    ).resolves.toEqual(expect.objectContaining({ title: 'Row title | FreePeriod' }));
  });

  it('falls back to "Lesson | FreePeriod" when there is no title', async () => {
    mockSingle.mockResolvedValue({
      data: { title: '', content: { title: '' } },
      error: null,
    });

    await expect(
      generateMetadata({ params: Promise.resolve({ id: 'lesson-1' }) }),
    ).resolves.toEqual(expect.objectContaining({ title: 'Lesson | FreePeriod' }));
  });

  it.each(['not-a-real-id', '00000000-0000-4000-8000-000000000000'])(
    'signals HTTP 404 instead of the Lesson fallback title when id is %s',
    async (id) => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

      await expect(generateMetadata({ params: Promise.resolve({ id }) })).rejects.toMatchObject({
        digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
        message: 'NEXT_HTTP_ERROR_FALLBACK;404',
      });

      expect(notFound).toHaveBeenCalled();
      await expect(generateMetadata({ params: Promise.resolve({ id }) })).rejects.not.toEqual(
        expect.objectContaining({ title: 'Lesson | FreePeriod' }),
      );
      expect(getMessages('en').status.notFoundDocumentTitle).not.toBe('Lesson | FreePeriod');
    },
  );

  it('keeps an em dash in a user-typed lesson title', async () => {
    const title = `States of Matter ${EM_DASH} Solids and Liquids`;
    mockSingle.mockResolvedValue({
      data: { title, content: { title } },
      error: null,
    });

    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'lesson-1' }) });
    expect(metadata.title).toBe(`${title} | FreePeriod`);
    expect(String(metadata.title)).toContain(EM_DASH);
    expect(String(metadata.title)).not.toContain('States of Matter, Solids');
    expect(String(metadata.title)).not.toContain('States of Matter - Solids');
  });
});
