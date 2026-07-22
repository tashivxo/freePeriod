import { render, screen } from '@/lib/test-utils';
import userEvent from '@testing-library/user-event';
import { SpotlightCard } from './SpotlightCard';

describe('SpotlightCard', () => {
  it('shows a centered glow when a child receives keyboard focus', async () => {
    const user = userEvent.setup();
    render(
      <SpotlightCard>
        <button type="button">Focus me</button>
      </SpotlightCard>,
    );

    const button = screen.getByRole('button', { name: /focus me/i });
    await user.tab();
    expect(button).toHaveFocus();

    const card = button.parentElement as HTMLElement;
    expect(card.style.getPropertyValue('--spotlight-opacity')).toBe('0.85');
    expect(card.style.getPropertyValue('--spotlight-x')).toBe('50%');
    expect(card.style.getPropertyValue('--spotlight-y')).toBe('50%');
  });
});
