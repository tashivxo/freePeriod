import type { LessonPlan, LessonSection } from '@/types';

export type LessonShareSnapshot = {
  title: string;
  subject: string;
  grade: string;
  duration_minutes: number;
  curriculum: string | null;
  content: LessonSection;
};

export function buildLessonShareSnapshot(lesson: LessonPlan): LessonShareSnapshot {
  const content = lesson.content as LessonSection;
  const displayTitle =
    (typeof content.title === 'string' && content.title.trim()) || lesson.title;
  return {
    title: displayTitle,
    subject: lesson.subject,
    grade: lesson.grade,
    duration_minutes: lesson.duration_minutes,
    curriculum: lesson.curriculum,
    content,
  };
}