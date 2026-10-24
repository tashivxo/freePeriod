/**
 * @jest-environment node
 */
import type { ReactElement } from 'react';

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockReadLocaleCookie = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

jest.mock('@/lib/i18n/server', () => ({
  readLocaleCookie: () => mockReadLocaleCookie(),
}));

jest.mock('@/features/help/components/HelpPageClient', () => ({
  HelpPageClient: () => null,
}));

import HelpPage, { generateMetadata } from '@/app/help/page';
import { legalConfig } from '@/lib/legal/config';
import { getMessages } from '@/lib/i18n';

type Rows = { users?: unknown; subscriptions?: unknown };

function mockRows(rows: Rows) {
  mockFrom.mockImplementation((table: 'users' | 'subscriptions') => {
    const query: Record<string, unknown> = {};
    query.select = jest.fn(() => query);
    query.eq = jest.fn(() => query);
    query.maybeSingle = jest.fn(async () => ({ data: rows[table] ?? null, error: null }));
    return query;
  });
}

const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

describe('/help server page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadLocaleCookie.mockResolvedValue('en');
  });

  it('renders signed out with only the support email and reads no account data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const element = (await HelpPage()) as ReactElement<Record<string, unknown>>;

    expect(element.props).toEqual({ signedIn: false, supportEmail: legalConfig.contactEmail });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('passes the signed-in account email, user id and plan', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'auth@example.com' } }, error: null });
    mockRows({ users: { email: 'profile@example.com', plan: 'pro', is_admin: false } });

    const element = (await HelpPage()) as ReactElement<Record<string, unknown>>;

    expect(element.props).toEqual(
      expect.objectContaining({
        signedIn: true,
        supportEmail: legalConfig.contactEmail,
        accountEmail: 'profile@example.com',
        userId: 'u1',
        plan: 'pro',
      }),
    );
  });

  it('labels admins as pro_plus', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@example.com' } }, error: null });
    mockRows({ users: { email: 'a@example.com', plan: 'free', is_admin: true } });

    const element = (await HelpPage()) as ReactElement<Record<string, unknown>>;

    expect(element.props.plan).toBe('pro_plus');
  });

  it('adds the days left to an active trial', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@example.com' } }, error: null });
    mockRows({
      users: { email: 'a@example.com', plan: 'pro', is_admin: false },
      subscriptions: { user_id: 'u1', trial_end: daysFromNow(5) },
    });

    const element = (await HelpPage()) as ReactElement<Record<string, unknown>>;

    expect(element.props.plan).toMatch(/^pro \(trial, \d+ days left\)$/);
  });

  it('falls back to the auth email when the profile row is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'auth@example.com' } }, error: null });
    mockRows({});

    const element = (await HelpPage()) as ReactElement<Record<string, unknown>>;

    expect(element.props.accountEmail).toBe('auth@example.com');
    expect(element.props.plan).toBeUndefined();
  });

  it('localizes the document title', async () => {
    mockReadLocaleCookie.mockResolvedValue('fr');

    await expect(generateMetadata()).resolves.toEqual(
      expect.objectContaining({ title: getMessages('fr').help.documentTitle }),
    );
  });
});
