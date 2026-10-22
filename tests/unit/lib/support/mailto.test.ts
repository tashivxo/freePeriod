import { buildSupportEmail, SUPPORT_MESSAGE_MAX_LENGTH } from '@/lib/support/mailto';

const diagnostics = {
  email: 'teacher@example.com',
  userId: 'user-123',
  plan: 'pro',
  locale: 'fr',
  page: '/settings',
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
        'Page: /settings',
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
});
