import React from 'react';
import { render, screen, waitFor } from '@/lib/test-utils';
import userEvent from '@testing-library/user-event';
import { UpdatePasswordPage } from './UpdatePasswordPage';

const mockUpdateUser = jest.fn();
const mockSetSession = jest.fn();
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      updateUser: mockUpdateUser,
      setSession: mockSetSession,
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  })),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

describe('UpdatePasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.delete('token');
    mockSearchParams.delete('token_hash');
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });
    mockSetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null });
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ valid: true }),
    }) as unknown as typeof fetch;
  });

  it('renders the heading', async () => {
    render(<UpdatePasswordPage />);
    expect(await screen.findByRole('heading', { name: /set new password/i })).toBeInTheDocument();
  });

  it('renders the new password input', async () => {
    render(<UpdatePasswordPage />);
    expect(await screen.findByLabelText(/new password/i)).toBeInTheDocument();
  });

  it('renders the confirm password input', async () => {
    render(<UpdatePasswordPage />);
    expect(await screen.findByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders two eye toggle buttons', async () => {
    render(<UpdatePasswordPage />);
    expect(await screen.findByLabelText(/new password/i)).toBeInTheDocument();
    const toggles = screen.getAllByRole('button', { name: /show password/i });
    expect(toggles).toHaveLength(2);
  });

  it('clicking first eye toggle reveals new password', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    const newPasswordInput = await screen.findByLabelText(/new password/i);
    expect(newPasswordInput).toHaveAttribute('type', 'password');
    const toggles = screen.getAllByRole('button', { name: /show password/i });
    await user.click(toggles[0]);
    expect(newPasswordInput).toHaveAttribute('type', 'text');
  });

  it('clicking second eye toggle reveals confirm password', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    const confirmInput = await screen.findByLabelText(/confirm password/i);
    expect(confirmInput).toHaveAttribute('type', 'password');
    const toggles = screen.getAllByRole('button', { name: /show password/i });
    await user.click(toggles[1]);
    expect(confirmInput).toHaveAttribute('type', 'text');
  });

  it('shows required errors on empty submit', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await screen.findByLabelText(/new password/i);
    await user.click(screen.getByRole('button', { name: /set new password/i }));
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
  });

  it('shows error when password is too short', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await user.type(await screen.findByLabelText(/new password/i), 'short');
    await user.type(screen.getByLabelText(/confirm password/i), 'short');
    await user.click(screen.getByRole('button', { name: /set new password/i }));
    expect(await screen.findByText(/must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await user.type(await screen.findByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'differentpass');
    await user.click(screen.getByRole('button', { name: /set new password/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('calls updateUser and redirects on valid submit', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await user.type(await screen.findByLabelText(/new password/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /set new password/i }));
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows server error on failure', async () => {
    mockUpdateUser.mockResolvedValue({ data: null, error: { message: 'Password too weak' } });
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await user.type(await screen.findByLabelText(/new password/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /set new password/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/stronger password/i);
  });

  it('shows recovery CTA when provider session is invalid', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ valid: false, reason: 'invalid' }),
    });
    render(<UpdatePasswordPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/reset link has expired/i);
    expect(screen.getByRole('link', { name: /request a new reset link/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('validates ?token= against the recovery API before showing the form', async () => {
    mockSearchParams.set('token', 'recovery-token-xyz');
    (global.fetch as jest.Mock).mockImplementation(async (url: RequestInfo) => {
      if (String(url).includes('/api/auth/validate-recovery')) {
        return { json: async () => ({ valid: true }) };
      }
      return { ok: true, json: async () => ({}) };
    });
    render(<UpdatePasswordPage />);
    expect(await screen.findByLabelText(/new password/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/validate-recovery',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'recovery-token-xyz' }),
      }),
    );
  });

  it('shows recovery CTA when ?token= is rejected by the API', async () => {
    mockSearchParams.set('token', 'bad-token');
    (global.fetch as jest.Mock).mockImplementation(async (url: RequestInfo, init?: RequestInit) => {
      if (String(url).includes('/api/auth/validate-recovery')) {
        if (init?.method === 'POST') {
          return { json: async () => ({ valid: false, reason: 'expired' }) };
        }
        return { json: async () => ({ valid: false, reason: 'invalid' }) };
      }
      return { ok: true, json: async () => ({}) };
    });
    render(<UpdatePasswordPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/reset link has expired/i);
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
  });

  it('shows form when token verify fails but provider session already exists', async () => {
    mockSearchParams.set('token', 'already-consumed');
    (global.fetch as jest.Mock).mockImplementation(async (url: RequestInfo, init?: RequestInit) => {
      if (String(url).includes('/api/auth/validate-recovery')) {
        if (init?.method === 'POST') {
          return { json: async () => ({ valid: false, reason: 'expired' }) };
        }
        return { json: async () => ({ valid: true }) };
      }
      return { ok: true, json: async () => ({}) };
    });
    render(<UpdatePasswordPage />);
    expect(await screen.findByLabelText(/new password/i)).toBeInTheDocument();
  });

  it('shows recovery CTA when update fails with expired session', async () => {
    mockUpdateUser.mockResolvedValue({ data: null, error: { message: 'Session expired' } });
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await user.type(await screen.findByLabelText(/new password/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /set new password/i }));
    expect(await screen.findByRole('link', { name: /request a new reset link/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('uses text-sm for the password length hint', async () => {
    render(<UpdatePasswordPage />);
    const hint = await screen.findByText(/must be at least 8 characters/i);
    expect(hint).toHaveClass('text-sm');
  });
});
