import { render, screen, waitFor } from '@/tests/helpers';
import { LocaleProvider } from '@/providers/locale';
import { getMessages, LOCALES, type Locale } from '@/lib/i18n';

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

import { SignUpPage } from '@/app/(auth)/sign-up/SignUpPage';
import { checkEmailAvailability } from '@/lib/auth/check-email-availability';
import { EMAIL_ALREADY_EXISTS } from '@/lib/auth/email';
import { expectErrorXIcon } from '@/tests/helpers/error-icon';

function renderSignUpPage(locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <SignUpPage />
    </LocaleProvider>,
  );
}

function getTermsRadio(name = /i agree to the terms of service and privacy policy/i) {
  return screen.getByRole('radio', { name });
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

  it('shows the animated X icon on the terms checkbox error', async () => {
    const { user } = renderSignUpPage();
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await fillMatchingPasswords(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    const alert = screen.getByText(/you must agree to the terms of service and privacy policy/i)
      .closest('[role="alert"]');
    expect(alert).toBeTruthy();
    expectErrorXIcon(alert as HTMLElement);
  });

  it('shows the animated X icon on shared field errors', async () => {
    const { user } = renderSignUpPage();
    await user.click(screen.getByRole('button', { name: /create account/i }));

    const alert = screen.getByText(/name is required/i).closest('[role="alert"]');
    expect(alert).toBeTruthy();
    expectErrorXIcon(alert as HTMLElement);
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
    await user.click(getTermsRadio());
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
    await user.click(getTermsRadio());
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
    await user.click(getTermsRadio());
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
    await user.click(getTermsRadio());
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
    await user.click(getTermsRadio());
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
    await user.click(getTermsRadio());
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
    await user.click(getTermsRadio());
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
    await user.click(getTermsRadio());
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      await screen.findByText(/an account with this email already exists/i),
    ).toBeInTheDocument();
  });

  it('renders Google button with logo and non-primary styling', () => {
    renderSignUpPage();
    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    expect(googleBtn.className).not.toContain('bg-primary');
    expect(googleBtn.querySelector('img')?.getAttribute('src')).toMatch(
      /brand(\/|%2F)google-g\.png/,
    );
  });

  it('renders the terms radio unchecked with a localized radiogroup label', () => {
    renderSignUpPage();
    const termsRadio = getTermsRadio();
    expect(termsRadio).not.toBeChecked();
    expect(screen.getByRole('radiogroup', { name: 'Terms agreement' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /i agree to the terms of service and privacy policy/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute(
      'href',
      '/terms',
    );
    expect(screen.getAllByRole('link', { name: /privacy policy/i })[0]).toHaveAttribute(
      'href',
      '/privacy',
    );
  });

  it('requires accepting terms before Continue with Google', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const mockOAuth = jest.fn();
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: jest.fn(),
        signInWithOAuth: mockOAuth,
      },
    });

    const { user } = renderSignUpPage();
    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(
      screen.getByText(/you must agree to the terms of service and privacy policy/i),
    ).toBeInTheDocument();
    expect(mockOAuth).not.toHaveBeenCalled();
  });

  it('starts Google OAuth after the terms checkbox is selected', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const mockOAuth = jest.fn().mockResolvedValue({ data: {}, error: null });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: jest.fn(),
        signInWithOAuth: mockOAuth,
      },
    });

    const { user } = renderSignUpPage();
    await user.click(getTermsRadio());
    expect(getTermsRadio()).toBeChecked();
    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(mockOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
        scopes: 'openid email profile',
      },
    });
  });

  it('keeps the Google spinner off the Create account button and recovers when sign-up throws', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: jest.fn().mockRejectedValue(new TypeError('Failed to fetch')),
        signInWithOAuth: jest.fn(() => new Promise(() => {})),
      },
    });

    const { user } = renderSignUpPage();
    await user.type(screen.getByLabelText(/name/i), 'Ada');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await fillMatchingPasswords(user);
    await user.click(getTermsRadio());
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/check your connection/i)).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: /create account/i });
    expect(submit).not.toHaveAttribute('aria-busy');

    await user.click(screen.getByRole('button', { name: /continue with google/i }));
    const google = screen.getByRole('button', { name: /continue with google/i });
    expect(google).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: /create account/i })).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();
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

  it('toggles the terms checkbox off on a second click and blocks sign-up again', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const mockSignUp = jest.fn();
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: mockSignUp,
        signInWithOAuth: jest.fn(),
      },
    });

    const { user } = renderSignUpPage();
    const radio = getTermsRadio();

    await user.click(radio);
    expect(radio).toBeChecked();
    await user.click(radio);
    expect(radio).not.toBeChecked();

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@test.com');
    await fillMatchingPasswords(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      screen.getByText(/you must agree to the terms of service and privacy policy/i),
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('toggles the terms radio with Space', async () => {
    const { user } = renderSignUpPage();
    const radio = getTermsRadio();

    radio.focus();
    await user.keyboard(' ');
    expect(radio).toBeChecked();

    await user.keyboard(' ');
    expect(radio).not.toBeChecked();
  });

  it('toggles the terms radio when the adjacent agreement text is clicked', async () => {
    const { user } = renderSignUpPage();
    const radio = getTermsRadio();

    await user.click(screen.getByText('to the'));
    expect(radio).toBeChecked();

    await user.click(screen.getByText('to the'));
    expect(radio).not.toBeChecked();
  });

  it('does not toggle the terms radio when a legal link is clicked', async () => {
    const { user } = renderSignUpPage();
    const radio = getTermsRadio();

    await user.click(screen.getByRole('link', { name: /terms of service/i }));
    expect(radio).not.toBeChecked();

    await user.click(screen.getAllByRole('link', { name: /privacy policy/i })[0]);
    expect(radio).not.toBeChecked();
  });

  it('keeps legal links as real anchors whose click is not default-prevented', () => {
    renderSignUpPage();
    const radio = getTermsRadio();
    const termsLink = screen.getByRole('link', { name: /terms of service/i });
    const privacyLink = screen.getAllByRole('link', { name: /privacy policy/i })[0];

    expect(termsLink.tagName).toBe('A');
    expect(termsLink).toHaveAttribute('href', '/terms');
    expect(termsLink).toHaveAttribute('target', '_blank');
    expect(privacyLink.tagName).toBe('A');
    expect(privacyLink).toHaveAttribute('href', '/privacy');
    expect(privacyLink).toHaveAttribute('target', '_blank');
    expect(termsLink.closest('button')).toBeNull();
    expect(privacyLink.closest('button')).toBeNull();

    const termsClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    termsLink.dispatchEvent(termsClick);
    expect(termsClick.defaultPrevented).toBe(false);
    expect(radio).not.toBeChecked();

    const privacyClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    privacyLink.dispatchEvent(privacyClick);
    expect(privacyClick.defaultPrevented).toBe(false);
    expect(radio).not.toBeChecked();
  });

  it('shows the localized terms required error for each locale', async () => {
    for (const locale of LOCALES) {
      const { user, unmount } = renderSignUpPage(locale);
      const auth = getMessages(locale).auth as unknown as Record<string, string>;

      await user.click(screen.getByRole('button', { name: /create account/i }));
      expect(screen.getByText(auth.termsRequired)).toBeInTheDocument();
      expect(screen.getByText(auth.termsRequired).textContent).not.toContain('\u2014');
      unmount();
    }
  });

  it('joins Arabic و to the privacy policy link with no following space', () => {
    renderSignUpPage('ar');
    const settings = getMessages('ar').settings;
    const radiogroup = screen.getByRole('radiogroup', {
      name: getMessages('ar').auth.termsAgreement,
    });

    expect(radiogroup.textContent).toContain(`و${settings.privacyPolicy}`);
    expect(radiogroup.textContent).not.toContain(`و ${settings.privacyPolicy}`);
    expect(radiogroup.textContent).not.toContain('و سياسة');
  });

  it('renders the Chinese agreement line without spaces around the legal links', () => {
    renderSignUpPage('zh-Hans');
    const settings = getMessages('zh-Hans').settings;
    const radiogroup = screen.getByRole('radiogroup', {
      name: getMessages('zh-Hans').auth.termsAgreement,
    });

    expect(radiogroup.textContent).toContain(`${settings.termsOfService}和${settings.privacyPolicy}`);
    expect(radiogroup.textContent).not.toMatch(/服务条款\s+和/);
    expect(radiogroup.textContent).not.toMatch(/和\s+隐私政策/);
  });

  it('keeps spaces in the English, Spanish, and French agreement lines', () => {
    const en = renderSignUpPage('en');
    expect(
      screen.getByRole('radiogroup', { name: 'Terms agreement' }).textContent,
    ).toMatch(/to the Terms of Service and Privacy Policy/);
    en.unmount();

    const es = renderSignUpPage('es');
    expect(
      screen.getByRole('radiogroup', { name: 'Acuerdo de términos' }).textContent,
    ).toMatch(/los Términos del servicio y la Política de privacidad/);
    es.unmount();

    renderSignUpPage('fr');
    expect(
      screen.getByRole('radiogroup', { name: 'Acceptation des conditions' }).textContent,
    ).toMatch(/les Conditions d'utilisation et la Politique de confidentialité/);
  });

  it('shows the ChipRadio selected style when the terms radio is checked', async () => {
    const { user } = renderSignUpPage();
    const radiogroup = screen.getByRole('radiogroup', { name: 'Terms agreement' });

    expect(radiogroup.querySelector('svg')).toBeNull();
    expect(radiogroup.querySelector('.bg-coral')).toBeNull();

    await user.click(getTermsRadio());

    expect(radiogroup.querySelector('svg')).not.toBeNull();
    const selected = radiogroup.querySelector('.bg-coral');
    expect(selected).not.toBeNull();
    expect(selected?.className).toContain('text-primary-foreground');
    expect(selected?.className).not.toContain('text-white');
  });

  it.each(LOCALES)('localizes the terms agreement control in %s', (locale) => {
    const auth = getMessages(locale).auth as unknown as Record<string, string>;
    const settings = getMessages(locale).settings;

    renderSignUpPage(locale);

    expect(screen.getByRole('radiogroup', { name: auth.termsAgreement })).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: auth.iAgreeAria }),
    ).toBeInTheDocument();
    expect(screen.getByText(auth.iAgree)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: settings.termsOfService })).toHaveAttribute(
      'href',
      '/terms',
    );
    expect(screen.getAllByRole('link', { name: settings.privacyPolicy })[0]).toHaveAttribute(
      'href',
      '/privacy',
    );
  });

  it('keeps the terms radio toggling in Arabic RTL', async () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';

    const { user } = renderSignUpPage('ar');
    const messages = getMessages('ar').auth as unknown as Record<string, string>;
    const radio = getTermsRadio(messages.iAgreeAria);
    const radiogroup = screen.getByRole('radiogroup', { name: messages.termsAgreement });

    expect(document.documentElement.dir).toBe('rtl');
    expect(radiogroup).toBeInTheDocument();

    await user.click(radio);
    expect(radio).toBeChecked();
    await user.click(radio);
    expect(radio).not.toBeChecked();

    radio.focus();
    await user.keyboard(' ');
    expect(radio).toBeChecked();

    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  });
});
