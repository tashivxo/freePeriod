import { render, screen } from '@/tests/helpers';
import { getMessages, LOCALES } from '@/lib/i18n';
import NotFound from '@/app/not-found';
import ErrorPage from '@/app/error';

describe('status page copy', () => {
  const keys = ['notFoundTitle', 'notFoundBody', 'errorTitle', 'errorBody', 'tryAgain', 'backHome'] as const;

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
