import React from 'react';
import { render, screen } from '@/tests/helpers';

const mockMotionSafeIcon = jest.fn(
  ({ icon: Icon }: { icon: React.ComponentType<{ size?: number }> }) => (
    <div data-testid="atmosphere-header-icon" data-icon={(Icon as { displayName?: string }).displayName} />
  ),
);

jest.mock('@/components/ui/icons/MotionSafeIcon', () => ({
  MotionSafeIcon: (props: { icon: React.ComponentType }) => mockMotionSafeIcon(props),
}));

jest.mock('@/providers/zen-mode', () => ({
  useZenMode: () => ({ zenMode: false, setZenMode: jest.fn() }),
}));

jest.mock('@/providers/color-bends-atmosphere', () => ({
  useColorBendsAtmosphere: () => ({
    atmosphere: null,
    setAtmosphere: jest.fn(),
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
});
