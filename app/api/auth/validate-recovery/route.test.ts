/**
 * @jest-environment node
 */
import { GET, POST } from './route';

const mockVerifyOtp = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      verifyOtp: mockVerifyOtp,
      getUser: mockGetUser,
    },
  })),
}));

describe('/api/auth/validate-recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST returns 400 when token is missing', async () => {
    const response = await POST(
      new Request('http://localhost/api/auth/validate-recovery', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ valid: false, reason: 'missing_token' });
  });

  it('POST validates token_hash via verifyOtp and getUser', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    const response = await POST(
      new Request('http://localhost/api/auth/validate-recovery', {
        method: 'POST',
        body: JSON.stringify({ token: 'abc123' }),
      }),
    );

    expect(mockVerifyOtp).toHaveBeenCalledWith({ type: 'recovery', token_hash: 'abc123' });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ valid: true });
  });

  it('POST returns expired when otp is expired', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email link is invalid or has expired', code: 'otp_expired' },
    });

    const response = await POST(
      new Request('http://localhost/api/auth/validate-recovery', {
        method: 'POST',
        body: JSON.stringify({ token_hash: 'dead' }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ valid: false, reason: 'expired' });
  });

  it('GET returns valid when getUser succeeds', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ valid: true });
  });

  it('GET returns invalid when no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Auth session missing' } });
    const response = await GET();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ valid: false, reason: 'invalid' });
  });
});
