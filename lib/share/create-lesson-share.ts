export type LessonShareResult = {
  url: string;
  fileName: string;
  contentType: string;
  usedDocxFallback: boolean;
  token: string;
};

export async function createLessonShare(lessonId: string): Promise<LessonShareResult> {
  const response = await fetch(`/api/lessons/${lessonId}/share`, { method: 'POST' });
  if (!response.ok) {
    throw new Error('share_failed');
  }
  return (await response.json()) as LessonShareResult;
}