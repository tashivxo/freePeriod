import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { useLessonActions } from '@/features/lesson/hooks/useLessonActions';

const mockRenameLesson = jest.fn();

jest.mock('@/lib/lesson/rename-lesson', () => ({
  renameLesson: (...args: unknown[]) => mockRenameLesson(...args),
}));

const eq = jest.fn();
const del = jest.fn(() => ({ eq }));
const from = jest.fn(() => ({ delete: del }));

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from }),
}));

type Row = { id: string; title: string };

function setup(afterDelete?: () => void | Promise<void>) {
  return renderHook(() => {
    const [lessons, setLessons] = useState<Row[]>([
      { id: 'a', title: 'Fractions' },
      { id: 'b', title: 'Decimals' },
    ]);
    const actions = useLessonActions(setLessons, { afterDelete });
    return { lessons, ...actions };
  });
}

describe('useLessonActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eq.mockResolvedValue({ error: null });
    mockRenameLesson.mockResolvedValue({ lesson: { id: 'a', title: 'Ratios', updated_at: '' } });
  });

  it('renames via the API and updates the row', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.handleRename('a', 'Ratios');
    });

    expect(mockRenameLesson).toHaveBeenCalledWith('a', 'Ratios');
    expect(result.current.lessons[0]!.title).toBe('Ratios');
    expect(from).not.toHaveBeenCalledWith('lesson_plans');
  });

  it('updates the title optimistically before the request resolves', async () => {
    let resolve!: () => void;
    mockRenameLesson.mockReturnValue(new Promise<void>((r) => (resolve = r)));
    const { result } = setup();

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.handleRename('a', 'Ratios');
    });
    expect(result.current.lessons[0]!.title).toBe('Ratios');

    await act(async () => {
      resolve();
      await pending;
    });
  });

  it('rolls back and rethrows when the update fails', async () => {
    mockRenameLesson.mockRejectedValue(new Error('rename_failed'));
    const { result } = setup();

    await act(async () => {
      await expect(result.current.handleRename('a', 'Ratios')).rejects.toBeTruthy();
    });

    expect(result.current.lessons[0]!.title).toBe('Fractions');
  });

  it('keeps the row and rethrows when the delete fails', async () => {
    eq.mockResolvedValue({ error: { message: 'boom' } });
    const afterDelete = jest.fn();
    const { result } = setup(afterDelete);

    await act(async () => {
      await expect(result.current.handleDelete('a')).rejects.toBeTruthy();
    });

    expect(result.current.lessons.map((l) => l.id)).toEqual(['a', 'b']);
    expect(afterDelete).not.toHaveBeenCalled();
  });

  it('deletes the row and runs the afterDelete callback', async () => {
    const afterDelete = jest.fn();
    const { result } = setup(afterDelete);

    await act(async () => {
      await result.current.handleDelete('a');
    });

    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('id', 'a');
    expect(result.current.lessons.map((l) => l.id)).toEqual(['b']);
    expect(afterDelete).toHaveBeenCalled();
  });
});