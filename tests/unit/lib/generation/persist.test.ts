import { linkUploadsToLesson, persistLessonPlan } from '@/lib/generation/persist';
import type { LessonSection } from '@/types';

const content = {
  title: 'Fractions',
  objectives: ['Add fractions'],
} as LessonSection;

function mockFrom(handlers: Record<string, unknown>) {
  return {
    from: jest.fn((table: string) => {
      const handler = handlers[table];
      if (!handler) {
        throw new Error(`Unexpected table ${table}`);
      }
      return handler;
    }),
  };
}

describe('linkUploadsToLesson', () => {
  it('is a no-op success when no upload paths are present', async () => {
    const supabase = mockFrom({});
    const result = await linkUploadsToLesson(supabase as never, {
      userId: 'user-1',
      lessonId: 'lesson-1',
      curriculumDocPath: null,
      templatePath: null,
    });

    expect(result).toEqual({ ok: true, lessonId: 'lesson-1' });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('surfaces a real error when an upload row cannot be linked', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'no row' } });
    const supabase = mockFrom({
      uploads: {
        update: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({ maybeSingle }),
              }),
            }),
          }),
        }),
      },
    });

    const result = await linkUploadsToLesson(supabase as never, {
      userId: 'user-1',
      lessonId: 'lesson-1',
      curriculumDocPath: 'user-1/curriculum_doc/unit.pdf',
      templatePath: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/could not be linked/i);
    }
  });
});

describe('persistLessonPlan', () => {
  it('links curriculum and template uploads after saving the lesson', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: 'upload-1' }, error: null });
    const userEq = jest.fn().mockResolvedValue({ error: null });
    const supabase = mockFrom({
      lesson_plans: {
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'lesson-1' }, error: null }),
          }),
        }),
      },
      users: {
        update: () => ({ eq: userEq }),
      },
      uploads: {
        update: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({ maybeSingle }),
              }),
            }),
          }),
        }),
      },
    });

    const result = await persistLessonPlan(supabase as never, {
      userId: 'user-1',
      title: 'Fractions',
      subject: 'Mathematics',
      grade: '8',
      curriculum: 'CAPS (South Africa)',
      durationMinutes: 60,
      content,
      modelUsed: 'gemini-2.5-flash',
      tokenCount: 12,
      curriculumDocPath: 'user-1/curriculum_doc/unit.pdf',
      templatePath: 'user-1/template/blank.docx',
      generationCount: 1,
    });

    expect(result).toEqual({ ok: true, lessonId: 'lesson-1' });
    expect(maybeSingle).toHaveBeenCalledTimes(2);
    expect(userEq).toHaveBeenCalledWith('id', 'user-1');
  });
});
