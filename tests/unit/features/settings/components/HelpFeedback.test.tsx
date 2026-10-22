import { render, screen } from '@/tests/helpers';
import { HelpFeedback } from '@/features/settings/components/HelpFeedback';

function renderHelp() {
  return render(
    <HelpFeedback
      supportEmail="support@freeperiod.co.za"
      accountEmail="teacher@example.com"
      userId="user-123"
      plan="pro"
    />,
  );
}

function emailLink() {
  return screen.getByRole('link', { name: /write email to support/i });
}

/** Stops jsdom from trying to navigate to mailto: while React still handles the click. */
function blockNavigation(link: HTMLElement) {
  link.addEventListener('click', (event) => event.preventDefault());
}

function bodyOf(link: HTMLElement) {
  return new URL(link.getAttribute('href')!).searchParams.get('body') ?? '';
}

describe('HelpFeedback', () => {
  it('renders as a labelled Help & feedback section with category, message and diagnostics', () => {
    renderHelp();
    expect(screen.getByRole('region', { name: /help & feedback/i })).toHaveAttribute('id', 'help');
    expect(screen.getByRole('radiogroup', { name: /what is it about/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Bug' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /include account and browser details/i })).toBeChecked();
    // Works as a plain link before hydration or with JS off.
    expect(emailLink()).toHaveAttribute('href', 'mailto:support@freeperiod.co.za');
  });

  it('blocks an empty message with an inline error and keeps the plain link', async () => {
    const { user } = renderHelp();
    await user.click(emailLink());

    expect(screen.getByRole('alert')).toHaveTextContent(/write a short message first/i);
    expect(screen.getByLabelText('Message')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Message')).toHaveFocus();
    expect(emailLink()).toHaveAttribute('href', 'mailto:support@freeperiod.co.za');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('fills the email with category, message and diagnostics, then shows next steps', async () => {
    const { user } = renderHelp();
    await user.click(screen.getByRole('radio', { name: 'Billing' }));
    await user.type(screen.getByLabelText('Message'), 'Charged twice');
    const link = emailLink();
    blockNavigation(link);
    await user.click(link);

    const url = new URL(link.getAttribute('href')!);
    expect(url.searchParams.get('subject')).toBe('[FreePeriod][Billing][pro] Charged twice');
    const body = bodyOf(link);
    expect(body).toMatch(/^Charged twice/);
    expect(body).toContain('Account: teacher@example.com');
    expect(body).toContain('User ID: user-123');
    expect(body).toContain('Language: en');
    expect(body).toContain('Page: /');
    expect(screen.getByRole('status')).toHaveTextContent(/support@freeperiod\.co\.za/);
  });

  it('leaves account details out when the diagnostics switch is off', async () => {
    const { user } = renderHelp();
    await user.click(screen.getByRole('switch', { name: /include account and browser details/i }));
    await user.type(screen.getByLabelText('Message'), 'Love it');
    const link = emailLink();
    blockNavigation(link);
    await user.click(link);

    expect(bodyOf(link)).toBe('Love it');
  });

  it('copies the full draft for people without an email app', async () => {
    const { user } = renderHelp();
    await user.type(screen.getByLabelText('Message'), 'Export is blank');
    const link = emailLink();
    blockNavigation(link);
    await user.click(link);
    await user.click(screen.getByRole('button', { name: /copy message/i }));

    expect(await screen.findByText('Copied')).toBeInTheDocument();
    const copied = await navigator.clipboard.readText();
    expect(copied).toMatch(/^To: support@freeperiod\.co\.za\nSubject: \[FreePeriod\]\[Bug\]\[pro\] Export is blank\n\nExport is blank/);
  });

  it('explains how to copy by hand when the clipboard is unavailable', async () => {
    const { user } = renderHelp();
    await user.type(screen.getByLabelText('Message'), 'Hi');
    const link = emailLink();
    blockNavigation(link);
    await user.click(link);
    jest.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'));
    await user.click(screen.getByRole('button', { name: /copy message/i }));

    expect(await screen.findByText(/could not copy/i)).toBeInTheDocument();
  });
});
