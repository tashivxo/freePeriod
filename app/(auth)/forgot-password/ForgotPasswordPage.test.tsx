import React from 'react';
import { render, screen, waitFor } from '@/lib/test-utils';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordPage } from './ForgotPasswordPage';

const mockResetPasswordForEmail = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  })),
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
  });

  it('renders the heading', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole('heading', { name: /recover password/i })).toBeInTheDocument();
  });

  it('renders the email input', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders the send reset link button', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('back to sign-in link has correct href', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/sign-in');
  });

  it('shows validation error when email is empty', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it('calls resetPasswordForEmail with redirectTo containing /auth/callback', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText(/email/i), 'teacher@school.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'teacher@school.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback'),
        }),
      );
    });
  });

  it('shows success state after submit', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText(/email/i), 'teacher@school.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/check your inbox/i);
  });

  it('shows server error on failure', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: null, error: { message: 'Rate limit exceeded' } });
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText(/email/i), 'teacher@school.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/rate limit exceeded/i);
  });
});
