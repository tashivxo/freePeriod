import React from 'react';
import { render, screen, waitFor } from '@/lib/test-utils';
import { SettingsClient } from './SettingsClient';
import type { User } from '@/types/database';

// ── Mocks ─────────────────────────────────────────────────────────────────────

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
  created_at: '2024-01-01T00:00:00Z',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SettingsClient — subject dropdown', () => {
  it('renders subject dropdown button associated with its label', () => {
    render(<SettingsClient user={baseUser} />);

    const trigger = screen.getByLabelText(/default subject/i);
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('opens the listbox and shows subject options on trigger click', async () => {
    const { user } = render(<SettingsClient user={baseUser} />);

    const trigger = screen.getByLabelText(/default subject/i);
    await user.click(trigger);

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    expect(screen.getByRole('option', { name: 'Mathematics' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Science' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Custom' })).toBeInTheDocument();
  });

  it('selecting a subject updates the displayed value', async () => {
    const { user } = render(<SettingsClient user={baseUser} />);

    const trigger = screen.getByLabelText(/default subject/i);
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Science' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/default subject/i).textContent?.trim()).toBe('Science');
    });
  });

  it('shows custom subject input when Custom is selected', async () => {
    const { user } = render(<SettingsClient user={baseUser} />);

    const trigger = screen.getByLabelText(/default subject/i);
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Custom' }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter subject/i)).toBeInTheDocument();
    });
  });

  it('pre-fills subject from user defaults (preset)', () => {
    const userWithSubject: User = { ...baseUser, default_subject: 'History' };
    render(<SettingsClient user={userWithSubject} />);

    expect(screen.getByLabelText(/default subject/i).textContent?.trim()).toBe('History');
  });

  it('pre-fills Custom + custom input when default_subject is not a preset', () => {
    const userWithCustom: User = { ...baseUser, default_subject: 'Yoga' };
    render(<SettingsClient user={userWithCustom} />);

    expect(screen.getByLabelText(/default subject/i).textContent?.trim()).toBe('Custom');
    expect(screen.getByPlaceholderText(/enter subject/i)).toHaveValue('Yoga');
  });
});
