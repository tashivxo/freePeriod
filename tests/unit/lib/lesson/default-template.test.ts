import {
  isValidDefaultTemplatePath,
  writeUserDefaultTemplate,
} from '@/lib/lesson/default-template';

describe('isValidDefaultTemplatePath', () => {
  const userId = 'user-1';

  it('accepts owned template paths under {id}/template/', () => {
    expect(isValidDefaultTemplatePath(userId, `${userId}/template/plan-123.docx`)).toBe(true);
  });

  it('rejects another user prefix', () => {
    expect(isValidDefaultTemplatePath(userId, 'other-user/template/plan.docx')).toBe(false);
  });

  it('rejects traversal, absolute paths, backslashes, and wrong folder', () => {
    expect(isValidDefaultTemplatePath(userId, `${userId}/../x`)).toBe(false);
    expect(isValidDefaultTemplatePath(userId, `/user-1/template/x`)).toBe(false);
    expect(isValidDefaultTemplatePath(userId, `${userId}\\template\\x`)).toBe(false);
    expect(isValidDefaultTemplatePath(userId, `${userId}/curriculum_doc/x`)).toBe(false);
  });

  it('rejects empty and null', () => {
    expect(isValidDefaultTemplatePath(userId, '')).toBe(false);
    expect(isValidDefaultTemplatePath(userId, null as unknown as string)).toBe(false);
  });
});

describe('writeUserDefaultTemplate', () => {
  it('rejects a foreign storage path without writing', async () => {
    const eq = jest.fn();
    const supabase = {
      from: jest.fn(() => ({
        update: () => ({ eq }),
      })),
    };

    const result = await writeUserDefaultTemplate(supabase as never, 'user-1', {
      path: 'other-user/template/plan.docx',
      fileName: 'plan.docx',
    });

    expect(result).toEqual({ ok: false, reason: 'invalid_path' });
    expect(eq).not.toHaveBeenCalled();
  });

  it('writes a paired path and file name for an owned template', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn(() => ({ eq }));
    const supabase = {
      from: jest.fn(() => ({ update })),
    };

    const result = await writeUserDefaultTemplate(supabase as never, 'user-1', {
      path: 'user-1/template/plan.docx',
      fileName: 'Plan.docx',
    });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      default_template_path: 'user-1/template/plan.docx',
      default_template_file_name: 'Plan.docx',
    });
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('clears both columns when value is null', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn(() => ({ eq }));
    const supabase = {
      from: jest.fn(() => ({ update })),
    };

    const result = await writeUserDefaultTemplate(supabase as never, 'user-1', null);

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      default_template_path: null,
      default_template_file_name: null,
    });
  });
});
