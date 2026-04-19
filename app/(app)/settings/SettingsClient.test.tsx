import { render, screen, waitFor } from '@/lib/test-utils';
import { userEvent } from '@testing-library/user-event';
import { SettingsClient } from './SettingsClient';
import type { User } from '@/types/database';

const baseUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  default_subject: null,
  default_grade: null,
  default_curriculum: null,
  generation_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  })),
}));

describe('SettingsClient', () => {
  it('renders the settings form with subject dropdown', () => {
    render(<SettingsClient user={baseUser} />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByLabelText(/default subject/i)).toBeInTheDocument();
  });

  it('displays all subject options in the dropdown', async () => {
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
