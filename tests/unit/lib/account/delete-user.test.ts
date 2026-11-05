const mockAdminFrom = jest.fn();
const mockAdminMaybeSingle = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: mockAdminFrom,
  })),
}));

import { collectStoragePaths } from '@/lib/account/delete-user';

describe('collectStoragePaths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'uploads') {
        return {
          select: () => ({
            eq: async () => ({
              data: [{ storage_path: 'user-1/curriculum_doc/a.pdf' }],
            }),
          }),
        };
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockAdminMaybeSingle,
            }),
          }),
        };
      }
      if (table === 'lesson_plans') {
        return {
          select: () => ({
            eq: async () => ({
              data: [{ id: 'lesson-1', template_path: 'user-1/template/old.docx' }],
            }),
          }),
        };
      }
      if (table === 'exports') {
        return {
          select: () => ({
            in: async () => ({
              data: [{ storage_path: 'user-1/exports/out.docx' }],
            }),
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });
  });

  it('includes users.default_template_path with uploads, lessons, and exports', async () => {
    mockAdminMaybeSingle.mockResolvedValue({
      data: { default_template_path: 'user-1/template/default.docx' },
    });

    const paths = await collectStoragePaths('user-1');

    expect(paths).toEqual(
      expect.arrayContaining([
        'user-1/curriculum_doc/a.pdf',
        'user-1/template/old.docx',
        'user-1/exports/out.docx',
        'user-1/template/default.docx',
      ]),
    );
  });

  it('skips null default_template_path', async () => {
    mockAdminMaybeSingle.mockResolvedValue({ data: { default_template_path: null } });

    const paths = await collectStoragePaths('user-1');

    expect(paths).not.toContain(null);
    expect(paths).toEqual(
      expect.arrayContaining([
        'user-1/curriculum_doc/a.pdf',
        'user-1/template/old.docx',
        'user-1/exports/out.docx',
      ]),
    );
  });
});
