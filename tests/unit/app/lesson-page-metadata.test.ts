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

jest.mock('@/features/lesson/components/LessonView', () => ({
  LessonView: () => null,
}));

import { generateMetadata } from '@/app/(app)/lesson/[id]/page';

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

  it('falls back to "Lesson | FreePeriod" when the lesson is missing', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    await expect(
      generateMetadata({ params: Promise.resolve({ id: 'missing' }) }),
    ).resolves.toEqual(expect.objectContaining({ title: 'Lesson | FreePeriod' }));
  });

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
