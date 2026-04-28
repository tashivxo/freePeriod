import { render, screen } from '@/lib/test-utils';

// Mock the Supabase client module
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithOAuth: jest.fn().mockResolvedValue({ data: {}, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  })),
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => mockSearchParams,
}));

import { SignInPage } from './SignInPage';

describe('SignInPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the sign-in heading', () => {
    render(<SignInPage />);
    expect(
      screen.getByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    render(<SignInPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders a sign-in submit button', () => {
    render(<SignInPage />);
    expect(
      screen.getByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it('renders Google OAuth button', () => {
    render(<SignInPage />);
    expect(
      screen.getByRole('button', { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it('renders magic link option', () => {
    render(<SignInPage />);
    expect(
      screen.getByRole('button', { name: /send magic link/i }),
    ).toBeInTheDocument();
  });

  it('renders a link to sign-up page', () => {
    render(<SignInPage />);
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
      'href',
      '/sign-up',
    );
  });

  it('shows validation error when email is empty and form submitted', async () => {
    const { user } = render(<SignInPage />);
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it('shows validation error when password is empty and form submitted', async () => {
    const { user } = render(<SignInPage />);
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('calls signInWithPassword on valid submit', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const mockSignIn = jest.fn().mockResolvedValue({ data: {}, error: null });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
        signInWithOtp: jest.fn(),
        signInWithOAuth: jest.fn(),
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    const { user } = render(<SignInPage />);
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    });
  });

  it('shows error message on failed sign-in', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const mockSignIn = jest.fn().mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' },
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
        signInWithOtp: jest.fn(),
        signInWithOAuth: jest.fn(),
      },
    });

    const { user } = render(<SignInPage />);
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/invalid login credentials/i),
    ).toBeInTheDocument();
  });

  it('renders Google button with same coral styling as Sign In button', () => {
    render(<SignInPage />);
    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    expect(googleBtn.className).toContain('bg-primary');
  });
});
