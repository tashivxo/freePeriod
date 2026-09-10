import { render, screen, waitFor } from '@/lib/test-utils';
import { LocaleProvider } from '@/providers/locale';

jest.mock('@/lib/auth/check-email-availability', () => ({
  checkEmailAvailability: jest.fn().mockResolvedValue('available'),
}));

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
import { checkEmailAvailability } from '@/lib/auth/check-email-availability';
import { EMAIL_ALREADY_EXISTS } from '@/lib/auth/email';

function renderSignUpPage() {
  return render(
    <LocaleProvider initialLocale="en">
      <SignUpPage />
    </LocaleProvider>,
  );
}

async function fillMatchingPasswords(
  user: ReturnType<typeof renderSignUpPage>['user'],
  password = 'password123',
) {
  await user.type(screen.getByLabelText('Password'), password);
  await user.type(screen.getByLabelText(/^confirm password$/i), password);
}

describe('SignUpPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkEmailAvailability as jest.Mock).mockResolvedValue('available');
  });

  it('renders the sign-up heading', () => {
    renderSignUpPage();
    expect(
      screen.getByRole('heading', { name: /create your account/i }),
    ).toBeInTheDocument();
  });

  it('renders name, email and password inputs', () => {
    renderSignUpPage();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders confirm password input', () => {
    renderSignUpPage();
    expect(screen.getByLabelText(/^confirm password$/i)).toBeInTheDocument();
  });

  it('renders a sign-up submit button', () => {
    renderSignUpPage();
    expect(
      screen.getByRole('button', { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it('renders Google OAuth button', () => {
    renderSignUpPage();
    expect(
      screen.getByRole('button', { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it('renders a link to sign-in page', () => {
    renderSignUpPage();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/sign-in',
    );
  });

  it('shows validation errors when fields are empty', async () => {
    const { user } = renderSignUpPage();
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
  });

  it('requires accepting terms before sign-up', async () => {
    const { user } = renderSignUpPage();
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await fillMatchingPasswords(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(
      screen.getByText(/you must agree to the terms of service and privacy policy/i),
    ).toBeInTheDocument();
  });

  it('shows validation error for short password', async () => {
    const { user } = renderSignUpPage();
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await fillMatchingPasswords(user, '123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(
      screen.getByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
  });

  it('shows mismatch error and does not call signUp when passwords differ', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const mockSignUp = jest.fn();
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: mockSignUp,
        signInWithOAuth: jest.fn(),
      },
    });

    const { user } = renderSignUpPage();
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'differentpass');
    await user.click(screen.getByRole('radio'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('calls signUp on valid submit', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const mockSignUp = jest.fn().mockResolvedValue({
      data: { session: null, user: { id: 'user-1' } },
      error: null,
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: mockSignUp,
        signInWithOAuth: jest.fn(),
      },
    });

    const { user } = renderSignUpPage();
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await fillMatchingPasswords(user);
    await user.click(screen.getByRole('radio'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'jane@test.com',
      password: 'password123',
      options: {
        data: { name: 'Jane Doe' },
      },
    });
  });

  it('shows taken email feedback and does not call signUp', async () => {
    jest.useFakeTimers();
    const { createClient } = await import('@/lib/supabase/client');
    const mockSignUp = jest.fn();
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: mockSignUp,
        signInWithOAuth: jest.fn(),
      },
    });
    (checkEmailAvailability as jest.Mock).mockResolvedValue('taken');

    const { user } = renderSignUpPage();
    await user.type(screen.getByLabelText(/email/i), 'taken@test.com');
    jest.advanceTimersByTime(400);

    await waitFor(() => {
      expect(screen.getByText(EMAIL_ALREADY_EXISTS)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await fillMatchingPasswords(user);
    await user.click(screen.getByRole('radio'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(mockSignUp).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('re-checks email on submit before signUp', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const mockSignUp = jest.fn().mockResolvedValue({
      data: { session: null, user: { id: 'user-1' } },
      error: null,
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: mockSignUp,
        signInWithOAuth: jest.fn(),
      },
    });

    const { user } = renderSignUpPage();
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await fillMatchingPasswords(user);
    await user.click(screen.getByRole('radio'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(checkEmailAvailability).toHaveBeenCalled();
    expect(mockSignUp).toHaveBeenCalled();
  });

  it('shows check-your-email state when signup returns no session', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const mockSignUp = jest.fn().mockResolvedValue({
      data: { session: null, user: { id: 'user-1' } },
      error: null,
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: mockSignUp,
        signInWithOAuth: jest.fn(),
      },
    });

    const { user } = renderSignUpPage();
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await fillMatchingPasswords(user);
    await user.click(screen.getByRole('radio'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      await screen.findByText(/check your email/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/jane@test.com/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('routes new users with a session to onboarding', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const mockSignUp = jest.fn().mockResolvedValue({
      data: {
        session: { access_token: 'tok' },
        user: { id: 'user-1' },
      },
      error: null,
    });
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: { onboarding_complete: false },
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: mockSignUp,
        signInWithOAuth: jest.fn(),
      },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      }),
    });

    const { user } = renderSignUpPage();
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await fillMatchingPasswords(user);
    await user.click(screen.getByRole('radio'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await screen.findByRole('button', { name: /create account/i });
    expect(mockPush).toHaveBeenCalledWith('/onboarding');
  });

  it('routes returning complete users with a session to dashboard', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const mockSignUp = jest.fn().mockResolvedValue({
      data: {
        session: { access_token: 'tok' },
        user: { id: 'user-1' },
      },
      error: null,
    });
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: { onboarding_complete: true },
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: mockSignUp,
        signInWithOAuth: jest.fn(),
      },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      }),
    });

    const { user } = renderSignUpPage();
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await fillMatchingPasswords(user);
    await user.click(screen.getByRole('radio'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await screen.findByRole('button', { name: /create account/i });
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
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

    const { user } = renderSignUpPage();
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await fillMatchingPasswords(user);
    await user.click(screen.getByRole('radio'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      await screen.findByText(/an account with this email already exists/i),
    ).toBeInTheDocument();
  });

  it('renders Google button with same coral styling as Create Account button', () => {
    renderSignUpPage();
    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    expect(googleBtn.className).toContain('bg-primary');
  });

  it('renders two distinct eye toggle buttons', () => {
    renderSignUpPage();
    expect(
      screen.getByRole('button', { name: /^show password$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /show confirm password/i }),
    ).toBeInTheDocument();
  });

  it('clicking password eye toggle changes password input type from password to text', async () => {
    const { user } = renderSignUpPage();
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: /^show password$/i }));
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('clicking confirm password eye toggle reveals confirm password', async () => {
    const { user } = renderSignUpPage();
    const confirmInput = screen.getByLabelText(/^confirm password$/i);
    expect(confirmInput).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: /show confirm password/i }));
    expect(confirmInput).toHaveAttribute('type', 'text');
  });
});
