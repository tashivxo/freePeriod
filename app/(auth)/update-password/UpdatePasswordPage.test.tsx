import React from 'react';
import { render, screen, waitFor } from '@/lib/test-utils';
import userEvent from '@testing-library/user-event';
import { UpdatePasswordPage } from './UpdatePasswordPage';

const mockUpdateUser = jest.fn();
const mockPush = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      updateUser: mockUpdateUser,
    },
  })),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('UpdatePasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });
  });

  it('renders the heading', () => {
    render(<UpdatePasswordPage />);
    expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument();
  });

  it('renders the new password input', () => {
    render(<UpdatePasswordPage />);
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });

  it('renders the confirm password input', () => {
    render(<UpdatePasswordPage />);
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders two eye toggle buttons', () => {
    render(<UpdatePasswordPage />);
    const toggles = screen.getAllByRole('button', { name: /show password/i });
    expect(toggles).toHaveLength(2);
  });

  it('clicking first eye toggle reveals new password', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    expect(newPasswordInput).toHaveAttribute('type', 'password');
    const toggles = screen.getAllByRole('button', { name: /show password/i });
    await user.click(toggles[0]);
    expect(newPasswordInput).toHaveAttribute('type', 'text');
  });

  it('clicking second eye toggle reveals confirm password', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    expect(confirmInput).toHaveAttribute('type', 'password');
    const toggles = screen.getAllByRole('button', { name: /show password/i });
    await user.click(toggles[1]);
    expect(confirmInput).toHaveAttribute('type', 'text');
  });

  it('shows required errors on empty submit', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await user.click(screen.getByRole('button', { name: /set new password/i }));
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
  });

  it('shows error when password is too short', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await user.type(screen.getByLabelText(/new password/i), 'short');
    await user.type(screen.getByLabelText(/confirm password/i), 'short');
    await user.click(screen.getByRole('button', { name: /set new password/i }));
    expect(await screen.findByText(/must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await user.type(screen.getByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'differentpass');
    await user.click(screen.getByRole('button', { name: /set new password/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('calls updateUser and redirects on valid submit', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /set new password/i }));
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows server error on failure', async () => {
    mockUpdateUser.mockResolvedValue({ data: null, error: { message: 'Session expired' } });
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /set new password/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/session expired/i);
  });
});
