import React from 'react';
import { render, screen } from '@/tests/helpers';

const mockSetAtmosphere = jest.fn();
const mockUseZenMode = jest.fn(() => ({ zenMode: false, setZenMode: jest.fn() }));

const mockMotionSafeIcon = jest.fn(
  ({ icon: Icon }: { icon: React.ComponentType<{ size?: number }> }) => (
    <div data-testid="atmosphere-header-icon" data-icon={(Icon as { displayName?: string }).displayName} />
  ),
);

jest.mock('@/components/ui/icons/MotionSafeIcon', () => ({
  MotionSafeIcon: (props: { icon: React.ComponentType }) => mockMotionSafeIcon(props),
}));

jest.mock('@/providers/zen-mode', () => ({
  useZenMode: () => mockUseZenMode(),
}));

jest.mock('@/providers/color-bends-atmosphere', () => ({
  useColorBendsAtmosphere: () => ({
    atmosphere: null,
    setAtmosphere: mockSetAtmosphere,
    resolvedAtmosphere: 'rainbow',
    setProfileSignals: jest.fn(),
  }),
}));

jest.mock('@/providers/locale', () => ({
  useT: () => (key: string) => key,
}));

import { AtmospherePicker } from '@/features/settings/components/AtmospherePicker';
import { ProjectorIcon } from '@/components/ui/icons/projector';

describe('AtmospherePicker', () => {
  beforeEach(() => {
    mockMotionSafeIcon.mockClear();
    mockSetAtmosphere.mockClear();
    mockUseZenMode.mockReturnValue({ zenMode: false, setZenMode: jest.fn() });
  });

  it('uses ProjectorIcon for the Background card header', () => {
    render(<AtmospherePicker />);

    expect(screen.getByTestId('atmosphere-header-icon')).toHaveAttribute(
      'data-icon',
      'ProjectorIcon',
    );
    expect(mockMotionSafeIcon).toHaveBeenCalledWith(
      expect.objectContaining({ icon: ProjectorIcon, size: 20 }),
    );
  });

  it('uses a labelled fieldset and shared native radio name', () => {
    render(<AtmospherePicker />);

    const group = screen.getByRole('group', { name: 'settings.background' });
    expect(group.tagName).toBe('FIELDSET');
    expect(group.querySelector('legend')).toHaveTextContent('settings.background');

    expect(screen.getAllByRole('radio')).toHaveLength(2);
    screen.getAllByRole('radio').forEach((radio) => {
      expect(radio).toHaveAttribute('name', 'fp-atmosphere');
    });
  });

  it('sets the chosen atmosphere when a tile is clicked', async () => {
    const { user } = render(<AtmospherePicker />);

    await user.click(screen.getByRole('radio', { name: 'settings.backgroundBrand' }));

    expect(mockSetAtmosphere).toHaveBeenCalledWith('brand');
  });

  it('disables both native radios and describes the Zen lock', () => {
    mockUseZenMode.mockReturnValue({ zenMode: true, setZenMode: jest.fn() });
    render(<AtmospherePicker />);

    const group = screen.getByRole('group', { name: 'settings.background' });
    const lock = screen.getByText('settings.backgroundZenLocked');

    expect(screen.getAllByRole('radio').every((radio) => radio.hasAttribute('disabled'))).toBe(true);
    expect(group).toHaveAttribute('aria-describedby', lock.id);
    expect(group).not.toHaveClass('opacity-40');
    expect(screen.getByTestId('atmosphere-tile-grid')).toHaveClass('opacity-40');
  });

  it('keeps Zen lock mounted but hidden when Zen is off', () => {
    render(<AtmospherePicker />);

    const group = screen.getByRole('group', { name: 'settings.background' });
    const lock = screen.getByText('settings.backgroundZenLocked');

    expect(group).toHaveClass('t-resize');
    expect(group).not.toHaveAttribute('aria-describedby');

    const wrapper = lock.parentElement;
    expect(wrapper).toHaveClass('t-resize-lock');
    expect(wrapper).toHaveAttribute('data-open', 'false');
    expect(lock).toHaveAttribute('aria-hidden', 'true');
  });

  it('opens the Zen lock wrapper and announces it when Zen is on', () => {
    mockUseZenMode.mockReturnValue({ zenMode: true, setZenMode: jest.fn() });
    render(<AtmospherePicker />);

    const group = screen.getByRole('group', { name: 'settings.background' });
    const lock = screen.getByText('settings.backgroundZenLocked');

    expect(lock.parentElement).toHaveAttribute('data-open', 'true');
    expect(lock).not.toHaveAttribute('aria-hidden');
    expect(group).toHaveAttribute('aria-describedby', lock.id);
    expect(screen.getAllByRole('radio').every((radio) => radio.hasAttribute('disabled'))).toBe(true);
  });
});
