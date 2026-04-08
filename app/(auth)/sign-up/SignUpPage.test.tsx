import { render, screen } from '@/lib/test-utils';

// Mock the Supabase client module
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithOAuth: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
  })),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { SignUpPage } from './SignUpPage';

describe('SignUpPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the sign-up heading', () => {
    render(<SignUpPage />);
    expect(
      screen.getByRole('heading', { name: /create your account/i }),
    ).toBeInTheDocument();
  });

  it('renders name, email and password inputs', () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders a sign-up submit button', () => {
    render(<SignUpPage />);
    expect(
      screen.getByRole('button', { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it('renders Google OAuth button', () => {
    render(<SignUpPage />);
    expect(
      screen.getByRole('button', { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it('renders a link to sign-in page', () => {
    render(<SignUpPage />);
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/sign-in',
    );
  });

  it('shows validation errors when fields are empty', async () => {
    const { user } = render(<SignUpPage />);
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows validation error for short password', async () => {
    const { user } = render(<SignUpPage />);
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await user.type(screen.getByLabelText(/password/i), '123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(
      screen.getByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
  });

  it('calls signUp on valid submit', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const mockSignUp = jest.fn().mockResolvedValue({ data: {}, error: null });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: mockSignUp,
        signInWithOAuth: jest.fn(),
      },
    });

    const { user } = render(<SignUpPage />);
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'jane@test.com',
      password: 'password123',
      options: {
        data: { name: 'Jane Doe' },
      },
    });
  });

  it('shows error message on failed sign-up', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const mockSignUp = jest.fn().mockResolvedValue({
      data: {},
      error: { message: 'User already registered' },
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: mockSignUp,
        signInWithOAuth: jest.fn(),
      },
    });

    const { user } = render(<SignUpPage />);
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      await screen.findByText(/user already registered/i),
    ).toBeInTheDocument();
  });

  it('renders Google button with same coral styling as Create Account button', () => {
    render(<SignUpPage />);
    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    expect(googleBtn.className).toContain('bg-primary');
  });
});
