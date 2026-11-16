import { buildLessonShareSnapshot } from '@/lib/share/snapshot';
import type { LessonPlan } from '@/types';

const baseLesson: LessonPlan = {
  id: 'id-1',
  user_id: 'user-1',
  title: 'Stored title',
  subject: 'Math',
  grade: '8',
  curriculum: 'CAPS',
  duration_minutes: 60,
  content: {
    title: 'Content title',
    objectives: ['A'],
    successCriteria: ['B'],
    keyConcepts: ['C'],
    hook: 'Hook',
    mainActivities: ['Act'],
    guidedPractice: ['GP'],
    independentPractice: ['IP'],
    formativeAssessment: ['FA'],
    differentiation: { support: [], extension: [] },
    realWorldConnections: [],
    plenary: 'Done',
  },
  model_used: 'gemini',
  token_count: 1,
  template_path: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('buildLessonShareSnapshot', () => {
  it('prefers content title over row title', () => {
    const snap = buildLessonShareSnapshot(baseLesson);
    expect(snap.title).toBe('Content title');
    expect(snap.subject).toBe('Math');
    expect(snap.content).toEqual(baseLesson.content);
  });
});