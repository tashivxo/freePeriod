import { render, screen, waitFor } from '@/tests/helpers';
import { getMessages, LOCALES, type Locale } from '@/lib/i18n';
import { LocaleProvider } from '@/providers/locale';
import NotFound from '@/app/not-found';
import ErrorPage from '@/app/error';
import GlobalError from '@/app/global-error';

const NOT_FOUND_DOCUMENT_TITLE: Record<Locale, string> = {
  en: 'Page not found | FreePeriod',
  ar: 'الصفحة غير موجودة | FreePeriod',
  es: 'Página no encontrada | FreePeriod',
  fr: 'Page introuvable | FreePeriod',
  'zh-Hans': '未找到页面 | FreePeriod',
};

describe('status page copy', () => {
  const keys = [
    'notFoundTitle',
    'notFoundBody',
    'notFoundDocumentTitle',
    'errorTitle',
    'errorBody',
    'tryAgain',
    'backHome',
  ] as const;

  it.each(LOCALES)('has every status string translated for %s', (locale) => {
    const copy = getMessages(locale).status;
    for (const key of keys) {
      expect(copy[key].trim()).not.toBe('');
      expect(copy[key]).not.toMatch(/—/);
      if (locale !== 'en') expect(copy[key]).not.toBe(getMessages('en').status[key]);
    }
  });
});

describe('NotFound', () => {
  it('shows the 404 copy and links back home', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { name: getMessages('en').status.notFoundTitle })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: getMessages('en').status.backHome })).toHaveAttribute('href', '/');
  });

  it.each(LOCALES)('sets a localized 404 tab title for %s', async (locale) => {
    render(<NotFound />, {
      wrapper: ({ children }) => <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>,
    });

    await waitFor(() => {
      expect(document.title).toBe(NOT_FOUND_DOCUMENT_TITLE[locale]);
    });
  });
});

describe('ErrorPage', () => {
  it('lets the user retry and go home', async () => {
    const reset = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { user } = render(<ErrorPage error={new Error('boom')} reset={reset} />);
    expect(screen.getByRole('heading', { name: getMessages('en').status.errorTitle })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: getMessages('en').status.tryAgain }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: getMessages('en').status.backHome })).toHaveAttribute('href', '/');
  });
});

describe('GlobalError', () => {
  beforeEach(() => {
    document.cookie = 'fp-locale=; Max-Age=0; path=/';
    document.documentElement.lang = 'en';
  });

  it('renders the shared error copy without crashing', () => {
    const reset = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      render(<GlobalError error={new Error('layout boom')} reset={reset} />),
    ).not.toThrow();

    expect(screen.getByRole('heading', { name: getMessages('en').status.errorTitle })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: getMessages('en').status.tryAgain })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: getMessages('en').status.backHome })).toHaveAttribute('href', '/');
  });
});
