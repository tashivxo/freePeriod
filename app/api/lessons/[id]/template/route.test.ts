/**
 * @jest-environment node
 */
import { PATCH } from './route';

const mockGetUser = jest.fn();

type QueryResult = { data: unknown; error: unknown };

const lessonSelectSingle = jest.fn<Promise<QueryResult>, unknown[]>();
const uploadVerifyMaybeSingle = jest.fn<Promise<QueryResult>, unknown[]>();
const lessonUpdateSingle = jest.fn<Promise<QueryResult>, unknown[]>();
const uploadUnlink = jest.fn<Promise<QueryResult>, unknown[]>();
const uploadLinkMaybeSingle = jest.fn<Promise<QueryResult>, unknown[]>();
const lessonRollbackEq = jest.fn<Promise<QueryResult>, unknown[]>();

function buildChain(terminal: () => Promise<QueryResult>) {
  const chain: Record<string, jest.Mock> = {};
  const self = () => chain;
  chain.select = jest.fn(self);
  chain.eq = jest.fn(self);
  chain.update = jest.fn(self);
  chain.single = jest.fn(terminal);
  chain.maybeSingle = jest.fn(terminal);
  return chain;
}

const lessonSelectChain = buildChain(() => lessonSelectSingle());
const lessonUpdateChain = buildChain(() => lessonUpdateSingle());

function buildAwaitableUpdateChain(terminal: () => Promise<QueryResult>) {
  const chain: Record<string, jest.Mock> = {};
  let eqCount = 0;
  chain.update = jest.fn(() => chain);
  chain.eq = jest.fn(() => {
    eqCount += 1;
    if (eqCount >= 2) {
      return terminal();
    }
    return chain;
  });
  return chain;
}

const lessonRollbackChain = buildAwaitableUpdateChain(() => lessonRollbackEq());
const uploadVerifyChain = buildChain(() => uploadVerifyMaybeSingle());

let uploadUpdateMode: 'link' | 'unlink' = 'link';
let uploadEqCount = 0;
const uploadEqChain: Record<string, jest.Mock> = {};
uploadEqChain.eq = jest.fn(() => {
  uploadEqCount += 1;
  if (uploadUpdateMode === 'unlink' && uploadEqCount >= 3) {
    return uploadUnlink();
  }
  if (uploadUpdateMode === 'link' && uploadEqCount >= 2) {
    return uploadLinkSelectChain;
  }
  return uploadEqChain;
});
const uploadLinkSelectChain: Record<string, jest.Mock> = {};
uploadLinkSelectChain.select = jest.fn(() => uploadLinkSelectChain);
uploadLinkSelectChain.maybeSingle = jest.fn(() => uploadLinkMaybeSingle());

let lessonPlanUpdateCount = 0;

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: jest.fn((table: string) => {
      if (table === 'lesson_plans') {
        return {
          select: () => lessonSelectChain,
          update: () => {
            lessonPlanUpdateCount += 1;
            if (lessonPlanUpdateCount > 1) {
              return lessonRollbackChain;
            }
            return lessonUpdateChain;
          },
        };
      }
      if (table === 'uploads') {
        return {
          select: () => uploadVerifyChain,
          update: (payload: unknown) => {
            uploadEqCount = 0;
            uploadUpdateMode =
              payload &&
              typeof payload === 'object' &&
              'lesson_id' in payload &&
              (payload as { lesson_id: string | null }).lesson_id === null
                ? 'unlink'
                : 'link';
            return uploadEqChain;
          },
        };
      }
      throw new Error(`Unexpected table ${table}`);
    }),
  })),
}));

function patchRequest(templatePath: string) {
  return PATCH(
    new Request('http://localhost/api/lessons/lesson-1/template', {
      method: 'PATCH',
      body: JSON.stringify({ templatePath }),
    }),
    { params: Promise.resolve({ id: 'lesson-1' }) },
  );
}

describe('PATCH /api/lessons/[id]/template', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lessonPlanUpdateCount = 0;
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    lessonSelectSingle.mockResolvedValue({
      data: { id: 'lesson-1', template_path: null },
      error: null,
    });
    uploadVerifyMaybeSingle.mockResolvedValue({ data: { id: 'upload-1' }, error: null });
    lessonUpdateSingle.mockResolvedValue({
      data: { id: 'lesson-1', template_path: 'user-1/template/plan.docx' },
      error: null,
    });
    uploadUnlink.mockResolvedValue({ data: null, error: null });
    uploadLinkMaybeSingle.mockResolvedValue({ data: { id: 'upload-1' }, error: null });
    lessonRollbackEq.mockResolvedValue({ data: null, error: null });
    uploadUpdateMode = 'link';
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });

    const response = await patchRequest('user-1/template/foo.docx');

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when templatePath is missing', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/lessons/lesson-1/template', {
        method: 'PATCH',
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: 'lesson-1' }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'templatePath is required' });
  });

  it('returns 403 when template path is not under the user uploads prefix', async () => {
    const response = await patchRequest('other-user/template/foo.docx');

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid template path' });
  });

  it('returns 400 when no matching template upload row exists', async () => {
    uploadVerifyMaybeSingle.mockResolvedValue({ data: null, error: null });

    const response = await patchRequest('user-1/template/plan.docx');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Template upload not found' });
  });

  it('returns 500 and rolls back lesson when linking upload fails', async () => {
    uploadLinkMaybeSingle.mockResolvedValue({ data: null, error: { message: 'link failed' } });

    const response = await patchRequest('user-1/template/plan.docx');

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to link template upload to lesson',
    });
    expect(lessonRollbackEq).toHaveBeenCalled();
  });

  it('unlinks previous upload when replacing template_path', async () => {
    lessonSelectSingle.mockResolvedValue({
      data: { id: 'lesson-1', template_path: 'user-1/template/old.docx' },
      error: null,
    });
    lessonUpdateSingle.mockResolvedValue({
      data: { id: 'lesson-1', template_path: 'user-1/template/plan.docx' },
      error: null,
    });

    const response = await patchRequest('user-1/template/plan.docx');

    expect(response.status).toBe(200);
    expect(uploadUnlink).toHaveBeenCalled();
  });

  it('updates template_path for the lesson owner when upload exists and links', async () => {
    const response = await patchRequest('user-1/template/plan.docx');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      lesson: { id: 'lesson-1', template_path: 'user-1/template/plan.docx' },
    });
    expect(uploadLinkMaybeSingle).toHaveBeenCalled();
  });
});
