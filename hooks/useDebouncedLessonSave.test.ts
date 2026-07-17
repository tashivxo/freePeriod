import { act, renderHook, waitFor } from '@testing-library/react';
import { useDebouncedLessonSave } from './useDebouncedLessonSave';
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
});
