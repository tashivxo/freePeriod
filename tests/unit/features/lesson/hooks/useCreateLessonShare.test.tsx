import { renderHook, waitFor } from '@testing-library/react';
import { useCreateLessonShare } from '@/features/lesson/hooks/useCreateLessonShare';
import { LocaleProvider } from '@/providers/locale';
import type { ReactNode } from 'react';

const shareResult = {
  url: 'https://example.test/s/token-1',
  fileName: 'Fractions.docx',
  contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  usedDocxFallback: false,
  token: 'token-1',
};

function wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

describe('useCreateLessonShare', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('starts loading and posts to the share API when open', async () => {
    let resolve!: (value: Response) => void;
    global.fetch = jest.fn(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    ) as typeof fetch;

    const onOpenChange = jest.fn();
    const { result, rerender } = renderHook(
      () =>
        useCreateLessonShare({
          open: true,
          lessonId: 'lesson-1',
          onOpenChange,
        }),
      { wrapper },
    );

    expect(result.current.loading).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/lessons/lesson-1/share', { method: 'POST' });

    resolve({
      ok: true,
      json: async () => shareResult,
    } as Response);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.share).toEqual(shareResult);

    rerender();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('sets an error when the share request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as typeof fetch;

    const { result } = renderHook(
      () =>
        useCreateLessonShare({
          open: true,
          lessonId: 'lesson-1',
          onOpenChange: jest.fn(),
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Couldn't create share link. Try again.");
    expect(result.current.share).toBeNull();
  });
});