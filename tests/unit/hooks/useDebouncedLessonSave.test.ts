import { act, renderHook, waitFor } from '@testing-library/react';
import { useDebouncedLessonSave } from '@/hooks/useDebouncedLessonSave';
import type { LessonSection } from '@/types';

const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: mockUpdate,
    })),
  })),
}));

const sampleContent: LessonSection = {
  title: 'Photosynthesis',
  objectives: ['Understand light reactions'],
  successCriteria: ['Label a chloroplast'],
  keyConcepts: ['Energy transfer'],
  hook: 'Leaf observation',
  mainActivities: ['Lab'],
  guidedPractice: ['Worksheet'],
  independentPractice: ['Exit ticket'],
  formativeAssessment: ['Quiz'],
  differentiation: { support: ['Visual aids'], extension: ['Research'] },
  realWorldConnections: ['Agriculture'],
  plenary: 'Summary discussion',
};

describe('useDebouncedLessonSave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows saving then saved after debounced save succeeds', async () => {
    const onSaved = jest.fn();

    const { result } = renderHook(() =>
      useDebouncedLessonSave('lesson-1', sampleContent, onSaved),
    );

    act(() => {
      result.current.save('hook', '<p>Updated hook</p>');
    });

    expect(result.current.status).toBe('idle');

    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('saved');
    });

    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ hook: 'Updated hook' }),
      'hook',
    );
  });

  it('sets error status when save fails', async () => {
    mockEq.mockResolvedValue({ error: { message: 'db error' } });
    const onSaved = jest.fn();

    const { result } = renderHook(() =>
      useDebouncedLessonSave('lesson-1', sampleContent, onSaved),
    );

    act(() => {
      result.current.save('hook', '<p>Broken save</p>');
      jest.advanceTimersByTime(30_000);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toBe('Failed to save changes');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('flush persists immediately without waiting for the debounce', async () => {
    const onSaved = jest.fn();

    const { result } = renderHook(() =>
      useDebouncedLessonSave('lesson-1', sampleContent, onSaved),
    );

    act(() => {
      result.current.save('hook', '<p>Updated hook</p>');
    });

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');

    await act(async () => {
      await expect(result.current.flush()).resolves.toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ hook: 'Updated hook' }),
      }),
    );
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ hook: 'Updated hook' }),
      'hook',
    );
    expect(result.current.status).toBe('saved');
  });

  it('keeps edits from two sections when flushing before the debounce', async () => {
    const onSaved = jest.fn();

    const { result } = renderHook(() =>
      useDebouncedLessonSave('lesson-1', sampleContent, onSaved),
    );

    act(() => {
      result.current.save('hook', '<p>Updated hook</p>');
      result.current.save('plenary', '<p>Updated plenary</p>');
    });

    await act(async () => {
      await expect(result.current.flush()).resolves.toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          hook: 'Updated hook',
          plenary: 'Updated plenary',
        }),
      }),
    );
  });

  it('flushes pending edits on unmount', async () => {
    const onSaved = jest.fn();

    const { result, unmount } = renderHook(() =>
      useDebouncedLessonSave('lesson-1', sampleContent, onSaved),
    );

    act(() => {
      result.current.save('hook', '<p>Updated hook</p>');
    });

    expect(mockUpdate).not.toHaveBeenCalled();
    unmount();

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({ hook: 'Updated hook' }),
        }),
      );
    });
  });

  it('flush is a successful no-op when nothing is pending', async () => {
    const onSaved = jest.fn();

    const { result } = renderHook(() =>
      useDebouncedLessonSave('lesson-1', sampleContent, onSaved),
    );

    await act(async () => {
      await expect(result.current.flush()).resolves.toBe(true);
    });

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('reverts a section to snapshot text and can drop the Edited key', async () => {
    const onSaved = jest.fn();

    const { result } = renderHook(() =>
      useDebouncedLessonSave(
        'lesson-1',
        { ...sampleContent, editedKeys: ['hook'] },
        onSaved,
      ),
    );

    await act(async () => {
      await expect(result.current.revert('hook', 'Leaf observation', false)).resolves.toBe(
        true,
      );
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          hook: 'Leaf observation',
          editedKeys: [],
        }),
      }),
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it('saves two paragraphs and a list, then a no-op edit keeps that content identical', async () => {
    const structuredHtml =
      '<p>Para one</p><p>Para two</p><ul><li><p>Item A</p></li><li><p>Item B</p></li></ul>';
    const structuredText = 'Para one\n\nPara two\n- Item A\n- Item B';
    const onSaved = jest.fn();

    const { result } = renderHook(() =>
      useDebouncedLessonSave('lesson-1', sampleContent, onSaved),
    );

    act(() => {
      result.current.save('hook', structuredHtml);
    });

    await act(async () => {
      await expect(result.current.flush()).resolves.toBe(true);
    });

    const savedContent = onSaved.mock.calls[0][0] as LessonSection;
    expect(savedContent.hook).toBe(structuredText);
    expect(savedContent.hook).not.toBe('Para onePara twoItem AItem B');
    expect(JSON.stringify(mockUpdate.mock.calls[0][0])).not.toMatch(/original_content/);

    const { result: reopened } = renderHook(() =>
      useDebouncedLessonSave('lesson-1', savedContent, onSaved),
    );

    act(() => {
      reopened.current.save('hook', structuredHtml);
    });

    await act(async () => {
      await expect(reopened.current.flush()).resolves.toBe(true);
    });

    const afterNoOp = onSaved.mock.calls[1][0] as LessonSection;
    expect(afterNoOp.hook).toBe(structuredText);
    expect(afterNoOp.hook).toBe(savedContent.hook);
  });

  it('does not store typed bullet glyphs when saving a list into an array section', async () => {
    const onSaved = jest.fn();

    const { result } = renderHook(() =>
      useDebouncedLessonSave('lesson-1', sampleContent, onSaved),
    );

    act(() => {
      result.current.save(
        'objectives',
        '<ul><li><p>Item A</p></li><li><p>Item B</p></li></ul>',
      );
    });

    await act(async () => {
      await expect(result.current.flush()).resolves.toBe(true);
    });

    expect(onSaved.mock.calls[0][0].objectives).toEqual(['Item A', 'Item B']);
  });

  it('returns false from flush when the database write fails', async () => {
    mockEq.mockResolvedValue({ error: { message: 'db error' } });
    const onSaved = jest.fn();

    const { result } = renderHook(() =>
      useDebouncedLessonSave('lesson-1', sampleContent, onSaved),
    );

    act(() => {
      result.current.save('hook', '<p>Broken save</p>');
    });

    await act(async () => {
      await expect(result.current.flush()).resolves.toBe(false);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Failed to save changes');
    expect(onSaved).not.toHaveBeenCalled();
  });
});
