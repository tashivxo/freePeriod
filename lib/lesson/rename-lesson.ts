export type RenameLessonResult = {
  lesson: {
    id: string;
    title: string;
    updated_at: string;
  };
};

export async function renameLesson(lessonId: string, title: string): Promise<RenameLessonResult> {
  const response = await fetch(`/api/lessons/${lessonId}/title`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error('rename_failed');
  }
  return (await response.json()) as RenameLessonResult;
}