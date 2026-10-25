import { render, screen } from '@/tests/helpers';
import { GoogleContinueButton } from '@/components/auth/GoogleContinueButton';
import { getMessages, LOCALES, type Locale } from '@/lib/i18n';
import { LocaleProvider } from '@/providers/locale';

const CONTINUE_WITH_GOOGLE: Record<Locale, string> = {
  en: 'Continue with Google',
  ar: 'المتابعة باستخدام Google',
  es: 'Continuar con Google',
  fr: 'Continuer avec Google',
  'zh-Hans': '使用 Google 继续',
};

describe('GoogleContinueButton', () => {
  it('renders Continue with Google with the Google mark', () => {
    render(<GoogleContinueButton onClick={jest.fn()} />);

    const button = screen.getByRole('button', { name: CONTINUE_WITH_GOOGLE.en });
    expect(button).toBeInTheDocument();
    expect(button.className).not.toContain('bg-primary');

    const img = button.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('aria-hidden', 'true');
    expect(img?.getAttribute('src')).toMatch(/brand(\/|%2F)google-g\.png/);
  });

  it.each(LOCALES)('renders the localized Continue with Google label for %s', (locale) => {
    render(<GoogleContinueButton onClick={jest.fn()} />, {
      wrapper: ({ children }) => <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>,
    });

    expect(screen.getByRole('button', { name: CONTINUE_WITH_GOOGLE[locale] })).toBeInTheDocument();
    expect(getMessages(locale).auth.continueWithGoogle).toBe(CONTINUE_WITH_GOOGLE[locale]);
  });

  it('forwards click and disabled state', async () => {
    const onClick = jest.fn();
    const { user, rerender } = render(
      <GoogleContinueButton onClick={onClick} />,
    );

    await user.click(screen.getByRole('button', { name: CONTINUE_WITH_GOOGLE.en }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<GoogleContinueButton onClick={onClick} disabled />);
    expect(screen.getByRole('button', { name: CONTINUE_WITH_GOOGLE.en })).toBeDisabled();
  });
});
