/**
 * @jest-environment node
 */
import { PATCH } from './route';

const mockGetUser = jest.fn();
const mockUpdate = jest.fn();
const mockEqLesson = jest.fn();
const mockEqUser = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      update: mockUpdate,
    })),
  })),
}));

describe('PATCH /api/lessons/[id]/template', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: mockEqLesson });
    mockEqLesson.mockReturnValue({ eq: mockEqUser });
    mockEqUser.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });

    const response = await PATCH(
      new Request('http://localhost/api/lessons/lesson-1/template', {
        method: 'PATCH',
        body: JSON.stringify({ templatePath: 'user-1/template/foo.docx' }),
      }),
      { params: Promise.resolve({ id: 'lesson-1' }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when templatePath is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

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
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

    const response = await PATCH(
      new Request('http://localhost/api/lessons/lesson-1/template', {
        method: 'PATCH',
        body: JSON.stringify({ templatePath: 'other-user/template/foo.docx' }),
      }),
      { params: Promise.resolve({ id: 'lesson-1' }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid template path' });
  });

  it('updates template_path for the lesson owner', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockSingle.mockResolvedValue({
      data: { id: 'lesson-1', template_path: 'user-1/template/plan.docx' },
      error: null,
    });

    const response = await PATCH(
      new Request('http://localhost/api/lessons/lesson-1/template', {
        method: 'PATCH',
        body: JSON.stringify({ templatePath: 'user-1/template/plan.docx' }),
      }),
      { params: Promise.resolve({ id: 'lesson-1' }) },
    );

    expect(mockUpdate).toHaveBeenCalledWith({ template_path: 'user-1/template/plan.docx' });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      lesson: { id: 'lesson-1', template_path: 'user-1/template/plan.docx' },
    });
  });
});
