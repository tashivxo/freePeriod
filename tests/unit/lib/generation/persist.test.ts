const mockAdminUserEq = jest.fn().mockResolvedValue({ error: null });
const mockCreateAdminClient = jest.fn(() => ({
  from: jest.fn((table: string) => {
    if (table === 'users') {
      return { update: () => ({ eq: mockAdminUserEq }) };
    }
    throw new Error(`Unexpected admin table ${table}`);
  }),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}));

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

  it('skips linking template uploads when path equals user default_template_path', async () => {
    const userMaybeSingle = jest.fn().mockResolvedValue({
      data: { default_template_path: 'user-1/template/shared.docx' },
      error: null,
    });
    const uploadMaybeSingle = jest.fn();
    const supabase = mockFrom({
      users: {
        select: () => ({
          eq: () => ({
            maybeSingle: userMaybeSingle,
          }),
        }),
      },
      uploads: {
        update: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({ maybeSingle: uploadMaybeSingle }),
              }),
            }),
          }),
        }),
      },
    });

    const result = await linkUploadsToLesson(supabase as never, {
      userId: 'user-1',
      lessonId: 'lesson-1',
      curriculumDocPath: null,
      templatePath: 'user-1/template/shared.docx',
    });

    expect(result).toEqual({ ok: true, lessonId: 'lesson-1' });
    expect(uploadMaybeSingle).not.toHaveBeenCalled();
  });

  it('still links a non-default template path', async () => {
    const userMaybeSingle = jest.fn().mockResolvedValue({
      data: { default_template_path: 'user-1/template/default.docx' },
      error: null,
    });
    const uploadMaybeSingle = jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null });
    const supabase = mockFrom({
      users: {
        select: () => ({
          eq: () => ({
            maybeSingle: userMaybeSingle,
          }),
        }),
      },
      uploads: {
        update: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({ maybeSingle: uploadMaybeSingle }),
              }),
            }),
          }),
        }),
      },
    });

    const result = await linkUploadsToLesson(supabase as never, {
      userId: 'user-1',
      lessonId: 'lesson-1',
      curriculumDocPath: null,
      templatePath: 'user-1/template/one-off.docx',
    });

    expect(result).toEqual({ ok: true, lessonId: 'lesson-1' });
    expect(uploadMaybeSingle).toHaveBeenCalled();
  });

  it('fails when a non-default template link misses', async () => {
    const userMaybeSingle = jest.fn().mockResolvedValue({
      data: { default_template_path: null },
      error: null,
    });
    const uploadMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const supabase = mockFrom({
      users: {
        select: () => ({
          eq: () => ({
            maybeSingle: userMaybeSingle,
          }),
        }),
      },
      uploads: {
        update: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({ maybeSingle: uploadMaybeSingle }),
              }),
            }),
          }),
        }),
      },
    });

    const result = await linkUploadsToLesson(supabase as never, {
      userId: 'user-1',
      lessonId: 'lesson-1',
      curriculumDocPath: null,
      templatePath: 'user-1/template/one-off.docx',
    });

    expect(result.ok).toBe(false);
  });
});

describe('persistLessonPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminUserEq.mockResolvedValue({ error: null });
    mockCreateAdminClient.mockImplementation(() => ({
      from: jest.fn((table: string) => {
        if (table === 'users') {
          return { update: () => ({ eq: mockAdminUserEq }) };
        }
        throw new Error(`Unexpected admin table ${table}`);
      }),
    }));
  });

  it('links curriculum and template uploads after saving the lesson', async () => {
    const userMaybeSingle = jest.fn().mockResolvedValue({
      data: { default_template_path: null },
      error: null,
    });
    const maybeSingle = jest.fn().mockResolvedValue({ data: { id: 'upload-1' }, error: null });
    const supabase = mockFrom({
      lesson_plans: {
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'lesson-1' }, error: null }),
          }),
        }),
      },
      users: {
        select: () => ({
          eq: () => ({
            maybeSingle: userMaybeSingle,
          }),
        }),
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
    expect(mockCreateAdminClient).toHaveBeenCalled();
    expect(mockAdminUserEq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('does not write generation_count through the user-scoped client', async () => {
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
    });

    await persistLessonPlan(supabase as never, {
      userId: 'user-1',
      title: 'Fractions',
      subject: 'Mathematics',
      grade: '8',
      curriculum: 'CAPS (South Africa)',
      durationMinutes: 60,
      content,
      modelUsed: 'gemini-2.5-flash',
      tokenCount: 12,
      curriculumDocPath: null,
      templatePath: null,
      generationCount: 1,
    });

    expect(supabase.from).not.toHaveBeenCalledWith('users');
    expect(userEq).not.toHaveBeenCalled();
  });

  it('refuses to persist a templatePath owned by another user', async () => {
    const insert = jest.fn();
    const supabase = mockFrom({
      lesson_plans: { insert },
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
      curriculumDocPath: null,
      templatePath: 'other-user/template/secret.docx',
      generationCount: 0,
    });

    expect(result).toEqual({ ok: false, error: 'Invalid template path' });
    expect(insert).not.toHaveBeenCalled();
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });

  it('snapshots original_content to the generated content on insert', async () => {
    const insert = jest.fn(() => ({
      select: () => ({
        single: async () => ({ data: { id: 'lesson-1' }, error: null }),
      }),
    }));
    const supabase = mockFrom({
      lesson_plans: { insert },
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
      curriculumDocPath: null,
      templatePath: null,
      generationCount: 0,
    });

    expect(result).toEqual({ ok: true, lessonId: 'lesson-1' });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        content,
        original_content: content,
      }),
    );
    expect(mockCreateAdminClient).toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalledWith('users');
  });
});

