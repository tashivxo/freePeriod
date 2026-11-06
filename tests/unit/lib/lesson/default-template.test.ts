import { isValidDefaultTemplatePath } from '@/lib/lesson/default-template';

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
