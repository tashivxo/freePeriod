const mockList = jest.fn();
const mockUserUpdate = jest.fn();
const mockMaybeSingle = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

function createSupabase() {
  return {
    from: jest.fn((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockMaybeSingle,
            }),
          }),
          update: () => ({
            eq: mockUserUpdate,
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    }),
    storage: {
      from: () => ({
        list: mockList,
      }),
    },
  };
}

import { loadDefaultTemplateForUser } from '@/lib/lesson/load-default-template';

describe('loadDefaultTemplateForUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserUpdate.mockResolvedValue({ error: null });
  });

  it('returns none when user has no default path', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { default_template_path: null, default_template_file_name: null },
    });

    const result = await loadDefaultTemplateForUser(createSupabase() as never, 'user-1');
    expect(result).toEqual({ status: 'none' });
  });

  it('returns present when storage object exists', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        default_template_path: 'user-1/template/plan.docx',
        default_template_file_name: 'Plan.docx',
      },
    });
    mockList.mockResolvedValue({ data: [{ name: 'plan.docx' }], error: null });

    const result = await loadDefaultTemplateForUser(createSupabase() as never, 'user-1');
    expect(result).toEqual({
      status: 'present',
      path: 'user-1/template/plan.docx',
      fileName: 'Plan.docx',
    });
  });

  it('clears stale columns and returns missing when object is gone', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        default_template_path: 'user-1/template/plan.docx',
        default_template_file_name: 'Plan.docx',
      },
    });
    mockList.mockResolvedValue({ data: [], error: null });

    const result = await loadDefaultTemplateForUser(createSupabase() as never, 'user-1');
    expect(result).toEqual({ status: 'missing' });
    expect(mockUserUpdate).toHaveBeenCalled();
  });

  it('keeps the stored default when storage listing fails', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        default_template_path: 'user-1/template/plan.docx',
        default_template_file_name: 'Plan.docx',
      },
    });
    mockList.mockResolvedValue({ data: null, error: { message: 'storage unavailable' } });

    const result = await loadDefaultTemplateForUser(createSupabase() as never, 'user-1');
    expect(result).toEqual({
      status: 'present',
      path: 'user-1/template/plan.docx',
      fileName: 'Plan.docx',
    });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });
});
