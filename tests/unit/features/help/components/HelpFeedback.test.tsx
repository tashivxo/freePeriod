import type { ComponentProps } from 'react';
import { render, screen } from '@/tests/helpers';
import { HelpFeedback } from '@/features/help/components/HelpFeedback';

function renderHelp(props?: Partial<ComponentProps<typeof HelpFeedback>>) {
  return render(
    <>
      <h1 id="help-heading">Help & feedback</h1>
      <HelpFeedback
        supportEmail="support@freeperiod.co.za"
        labelledBy="help-heading"
        accountEmail="teacher@example.com"
        userId="user-123"
        plan="pro"
        {...props}
      />
    </>,
  );
}

function emailLink() {
  return screen.getByRole('link', { name: /write email to support/i });
}

function blockNavigation(link: HTMLElement) {
  link.addEventListener('click', (event) => event.preventDefault());
}

function bodyOf(link: HTMLElement) {
  return new URL(link.getAttribute('href')!).searchParams.get('body') ?? '';
}

describe('HelpFeedback', () => {
  it('renders as a labelled Help & feedback region with category, message and diagnostics', () => {
    renderHelp();
    expect(screen.getByRole('region', { name: /help & feedback/i })).toHaveAttribute('id', 'help');
    expect(screen.getByRole('radiogroup', { name: /what is it about/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Bug' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /include account and browser details/i })).toBeChecked();
    expect(emailLink()).toHaveAttribute('href', 'mailto:support@freeperiod.co.za');
  });

  it('uses guest diagnostics copy when no account is present', () => {
    renderHelp({ accountEmail: undefined, userId: undefined, plan: undefined });
    expect(screen.getByRole('switch', { name: /include browser details/i })).toBeChecked();
    expect(screen.getByText(/adds your browser and language/i)).toBeInTheDocument();
    expect(screen.queryByText(/your email, plan/i)).not.toBeInTheDocument();
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
    expect(body).not.toContain('Page:');
    expect(screen.getByRole('status')).toHaveTextContent(/support@freeperiod\.co\.za/);
    const email = screen.getByText('support@freeperiod.co.za');
    expect(email.tagName).toBe('BDI');
    expect(email).toHaveAttribute('dir', 'ltr');
  });

  it('leaves account fields out of a guest diagnostics payload', async () => {
    const { user } = renderHelp({ accountEmail: undefined, userId: undefined, plan: undefined });
    await user.type(screen.getByLabelText('Message'), 'Cannot sign in');
    const link = emailLink();
    blockNavigation(link);
    await user.click(link);

    const url = new URL(link.getAttribute('href')!);
    expect(url.searchParams.get('subject')).toBe('[FreePeriod][Bug][signed-out] Cannot sign in');
    const body = bodyOf(link);
    expect(body).toMatch(/^Cannot sign in/);
    expect(body).toContain('Language: en');
    expect(body).toContain('Browser:');
    expect(body).not.toMatch(/Account:|User ID:|Plan:/);
  });

  it('tells the teacher when a long message had to be shortened in the email', async () => {
    const { user } = renderHelp();
    const textarea = screen.getByLabelText('Message');
    await user.click(textarea);
    await user.paste('ق'.repeat(900));
    const link = emailLink();
    blockNavigation(link);
    await user.click(link);

    expect(screen.getByRole('status')).toHaveTextContent(/shortened copy/i);
  });

  it('resets a stale draft on the link when a later click is blocked', async () => {
    const { user } = renderHelp();
    await user.type(screen.getByLabelText('Message'), 'First');
    const link = emailLink();
    blockNavigation(link);
    await user.click(link);
    expect(link.getAttribute('href')).toContain('body=');

    await user.clear(screen.getByLabelText('Message'));
    await user.click(link);
    expect(link).toHaveAttribute('href', 'mailto:support@freeperiod.co.za');
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
    expect(copied).toMatch(
      /^To: support@freeperiod\.co\.za\nSubject: \[FreePeriod\]\[Bug\]\[pro\] Export is blank\n\nExport is blank/,
    );
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
