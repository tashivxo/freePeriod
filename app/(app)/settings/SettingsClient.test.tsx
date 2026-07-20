import React from 'react';
import { render, screen, waitFor } from '@/lib/test-utils';
import { SettingsClient } from './SettingsClient';
import { useZenMode } from '@/providers/zen-mode';
import type { User } from '@/types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSetZenMode = jest.fn();

jest.mock('@/providers/zen-mode', () => ({
  useZenMode: jest.fn(() => ({ zenMode: false, setZenMode: mockSetZenMode })),
}));

const mockUpdate = jest.fn().mockReturnValue({
  eq: jest.fn().mockResolvedValue({ error: null }),
});

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: mockUpdate,
    })),
  })),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseUser: User = {
  id: 'user-123',
  email: 'teacher@example.com',
  name: 'Ada Lovelace',
  default_subject: null,
  default_grade: null,
  default_curriculum: null,
  plan: 'free',
  generation_count: 5,
  generation_count_reset_at: null,
  onboarding_complete: true,
  deletion_scheduled_at: null,
  created_at: '2024-01-01T00:00:00Z',
};

const defaultProps = {
  user: baseUser,
  email: baseUser.email,
  planLabel: 'Free',
  usageLabel: '2 of 3 used this period',
  manageSubscriptionUrl: null as string | null,
};

async function changeSubjectToScience(user: Awaited<ReturnType<typeof render>>['user']) {
  const trigger = screen.getByLabelText(/default subject/i);
  await user.click(trigger);
  await user.click(screen.getByRole('option', { name: 'Science' }));
  await waitFor(() => {
    expect(screen.getByLabelText(/default subject/i).textContent?.trim()).toBe('Science');
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SettingsClient — account context', () => {
  it('shows read-only email, plan, and usage', () => {
    render(
      <SettingsClient
        {...defaultProps}
        planLabel="Pro"
        usageLabel="5 of 20 used this period"
      />,
    );

    expect(screen.getByText('teacher@example.com')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('5 of 20 used this period')).toBeInTheDocument();
  });

  it('does not show manage subscription when portal URL is missing', () => {
    render(<SettingsClient {...defaultProps} />);

    expect(screen.queryByRole('link', { name: /manage subscription/i })).not.toBeInTheDocument();
  });

  it('shows manage subscription when portal URL is available', () => {
    render(
      <SettingsClient
        {...defaultProps}
        planLabel="Pro"
        manageSubscriptionUrl="https://example.lemonsqueezy.com/billing"
      />,
    );

    const link = screen.getByRole('link', { name: /manage subscription/i });
    expect(link).toHaveAttribute('href', 'https://example.lemonsqueezy.com/billing');
  });
});

describe('SettingsClient — legal links', () => {
  it('links to privacy policy and terms of service in the same tab', () => {
    render(<SettingsClient {...defaultProps} />);

    const privacy = screen.getByRole('link', { name: /privacy policy/i });
    const terms = screen.getByRole('link', { name: /terms of service/i });

    expect(privacy).toHaveAttribute('href', '/privacy');
    expect(terms).toHaveAttribute('href', '/terms');
    expect(privacy).not.toHaveAttribute('target');
    expect(terms).not.toHaveAttribute('target');
  });
});

describe('SettingsClient — subject dropdown', () => {
  it('renders subject dropdown button associated with its label', () => {
    render(<SettingsClient {...defaultProps} />);

    const trigger = screen.getByLabelText(/default subject/i);
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('opens the listbox and shows subject options on trigger click', async () => {
    const { user } = render(<SettingsClient {...defaultProps} />);

    const trigger = screen.getByLabelText(/default subject/i);
    await user.click(trigger);

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    expect(screen.getByRole('option', { name: 'Mathematics' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Science' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Custom' })).toBeInTheDocument();
  });

  it('selecting a subject updates the displayed value', async () => {
    const { user } = render(<SettingsClient {...defaultProps} />);

    await changeSubjectToScience(user);
  });

  it('shows custom subject input when Custom is selected', async () => {
    const { user } = render(<SettingsClient {...defaultProps} />);

    const trigger = screen.getByLabelText(/default subject/i);
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Custom' }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter subject/i)).toBeInTheDocument();
    });
  });

  it('pre-fills subject from user defaults (preset)', () => {
    const userWithSubject: User = { ...baseUser, default_subject: 'History' };
    render(<SettingsClient {...defaultProps} user={userWithSubject} />);

    expect(screen.getByLabelText(/default subject/i).textContent?.trim()).toBe('History');
  });

  it('pre-fills Custom + custom input when default_subject is not a preset', () => {
    const userWithCustom: User = { ...baseUser, default_subject: 'Yoga' };
    render(<SettingsClient {...defaultProps} user={userWithCustom} />);

    expect(screen.getByLabelText(/default subject/i).textContent?.trim()).toBe('Custom');
    expect(screen.getByPlaceholderText(/enter subject/i)).toHaveValue('Yoga');
  });
});

describe('SettingsClient — zen mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useZenMode as jest.Mock).mockReturnValue({ zenMode: false, setZenMode: mockSetZenMode });
  });

  it('renders zen mode switch with description', () => {
    render(<SettingsClient {...defaultProps} />);

    expect(screen.getByRole('switch', { name: /zen mode/i })).toBeInTheDocument();
    expect(
      screen.getByText(/are our colorful backgrounds too much for you\? try zen mode/i),
    ).toBeInTheDocument();
  });

  it('toggling zen mode switch calls setZenMode(true)', async () => {
    const { user } = render(<SettingsClient {...defaultProps} />);

    await user.click(screen.getByRole('switch', { name: /zen mode/i }));

    expect(mockSetZenMode).toHaveBeenCalledWith(true);
  });
});

describe('SettingsClient — dirty save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  it('disables Save until a field changes', () => {
    render(<SettingsClient {...defaultProps} />);

    expect(screen.getByRole('button', { name: /save settings/i })).toBeDisabled();
  });

  it('enables Save after a field changes, then disables again after successful save', async () => {
    const { user } = render(<SettingsClient {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    expect(saveButton).toBeDisabled();

    await changeSubjectToScience(user);
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    expect(await screen.findByRole('status')).toHaveTextContent(/settings saved/i);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save settings/i })).toBeDisabled();
    });
  });
});

describe('SettingsClient — save feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  it('shows an inline success status after saving', async () => {
    const { user } = render(<SettingsClient {...defaultProps} />);

    await changeSubjectToScience(user);
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/settings saved/i);
  });

  it('shows an inline error status when save fails', async () => {
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: { message: 'db error' } }),
    });
    const { user } = render(<SettingsClient {...defaultProps} />);

    await changeSubjectToScience(user);
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/failed to save settings/i);
  });
});
