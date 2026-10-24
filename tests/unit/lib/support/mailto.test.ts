import {
  buildSupportEmail,
  SUPPORT_MAILTO_MAX_LENGTH,
  SUPPORT_MESSAGE_MAX_LENGTH,
} from '@/lib/support/mailto';

const diagnostics = {
  email: 'teacher@example.com',
  userId: 'user-123',
  plan: 'pro',
  locale: 'fr',
  browser: 'TestBrowser/1.0',
  sentAt: '2026-10-22T10:00:00.000Z',
};

function parse(href: string) {
  const url = new URL(href);
  return {
    to: decodeURIComponent(url.pathname),
    subject: url.searchParams.get('subject'),
    body: url.searchParams.get('body'),
  };
}

describe('buildSupportEmail', () => {
  it('tags the subject with the English category and plan, then the first line of the message', () => {
    const { subject } = buildSupportEmail({
      to: 'support@freeperiod.co.za',
      category: 'billing',
      message: '  Mon paiement a échoué\nDeuxième ligne',
      plan: 'pro',
    });
    expect(subject).toBe('[FreePeriod][Billing][pro] Mon paiement a échoué');
  });

  it('shortens long subjects with an ellipsis', () => {
    const { subject } = buildSupportEmail({
      to: 'support@freeperiod.co.za',
      category: 'bug',
      message: 'x'.repeat(200),
      plan: 'free',
    });
    expect(subject.endsWith('...')).toBe(true);
    expect(subject.length).toBeLessThanOrEqual('[FreePeriod][Bug][free] '.length + 60);
  });

  it('adds labelled diagnostics after the message only when provided', () => {
    const withDiag = buildSupportEmail({
      to: 'support@freeperiod.co.za',
      category: 'bug',
      message: 'Export is blank',
      plan: 'pro',
      diagnostics,
    });
    expect(withDiag.body).toBe(
      [
        'Export is blank',
        '',
        '---',
        'Category: Bug',
        'Account: teacher@example.com',
        'User ID: user-123',
        'Plan: pro',
        'Language: fr',
        'Browser: TestBrowser/1.0',
        'Sent: 2026-10-22T10:00:00.000Z',
      ].join('\r\n'),
    );

    const withoutDiag = buildSupportEmail({
      to: 'support@freeperiod.co.za',
      category: 'bug',
      message: 'Export is blank',
      plan: 'pro',
    });
    expect(withoutDiag.body).toBe('Export is blank');
    expect(withoutDiag.body).not.toMatch(/teacher@example\.com|user-123/);
  });

  it('encodes characters that would otherwise break the mailto: link', () => {
    const message = 'Q&A? 50% #1 a=b\nnext line';
    const { href } = buildSupportEmail({
      to: 'support@freeperiod.co.za',
      category: 'idea',
      message,
      plan: 'free',
    });
    expect(href.startsWith('mailto:support@freeperiod.co.za?subject=')).toBe(true);
    expect(href).not.toMatch(/[\s#]/);
    expect(href).toContain('%0D%0A');
    const parsed = parse(href);
    expect(parsed.to).toBe('support@freeperiod.co.za');
    expect(parsed.body).toBe('Q&A? 50% #1 a=b\r\nnext line');
  });

  it('caps the message length so the link stays usable', () => {
    const { body } = buildSupportEmail({
      to: 'support@freeperiod.co.za',
      category: 'bug',
      message: 'y'.repeat(SUPPORT_MESSAGE_MAX_LENGTH + 500),
      plan: 'free',
    });
    expect(body.length).toBe(SUPPORT_MESSAGE_MAX_LENGTH);
  });

  it('does not crash on emoji at the subject or length cut points', () => {
    const message = `${'a'.repeat(56)}😀😀 and ${'😀'.repeat(SUPPORT_MESSAGE_MAX_LENGTH)}`;
    expect(() =>
      buildSupportEmail({ to: 'support@freeperiod.co.za', category: 'bug', message, plan: 'free' }),
    ).not.toThrow();
  });

  it('keeps short drafts whole', () => {
    const email = buildSupportEmail({
      to: 'support@freeperiod.co.za',
      category: 'bug',
      message: 'Short note',
      plan: 'pro',
      diagnostics,
    });
    expect(email.shortened).toBe(false);
    expect(parse(email.href).body).toBe(email.body);
  });

  it('shortens the link, not the copyable body, when encoding makes it too long', () => {
    // 1000 Arabic characters encode to about 6,000 URL characters.
    const message = 'خ'.repeat(SUPPORT_MESSAGE_MAX_LENGTH);
    const email = buildSupportEmail({
      to: 'support@freeperiod.co.za',
      category: 'bug',
      message,
      plan: 'pro',
      diagnostics,
    });

    expect(email.shortened).toBe(true);
    expect(email.href.length).toBeLessThanOrEqual(SUPPORT_MAILTO_MAX_LENGTH);
    expect(email.body.startsWith(message)).toBe(true);
    const linked = parse(email.href).body!;
    expect(linked).toContain('[Message shortened to fit an email link.');
    expect(linked).toContain('User ID: user-123');
  });

  it('never splits an emoji when shortening', () => {
    const email = buildSupportEmail({
      to: 'support@freeperiod.co.za',
      category: 'idea',
      message: '😀'.repeat(SUPPORT_MESSAGE_MAX_LENGTH / 2),
      plan: 'free',
    });
    expect(email.shortened).toBe(true);
    // decodeURIComponent throws on a lone surrogate half.
    expect(() => parse(email.href)).not.toThrow();
  });

  it('omits Account, User ID and Plan lines when those diagnostics fields are absent', () => {
    const { body, subject } = buildSupportEmail({
      to: 'support@freeperiod.co.za',
      category: 'bug',
      message: 'Cannot sign in',
      plan: 'signed-out',
      diagnostics: {
        locale: 'en',
        browser: 'TestBrowser/1.0',
        sentAt: '2026-10-24T12:00:00.000Z',
      },
    });

    expect(subject).toBe('[FreePeriod][Bug][signed-out] Cannot sign in');
    expect(body).toBe(
      [
        'Cannot sign in',
        '',
        '---',
        'Category: Bug',
        'Language: en',
        'Browser: TestBrowser/1.0',
        'Sent: 2026-10-24T12:00:00.000Z',
      ].join('\r\n'),
    );
    expect(body).not.toMatch(/Account:|User ID:|Plan:/);
  });
});
