import { render, screen } from '@/tests/helpers';
import { PendingStatus } from '@/components/ui/pending-status';

describe('PendingStatus', () => {
  it('exposes role status with the message for inset layout', () => {
    render(<PendingStatus layout="inset" message="Preparing your share link…" />);

    expect(screen.getByRole('status')).toHaveTextContent('Preparing your share link…');
  });

  it('uses overlay positioning for card opening state', () => {
    render(<PendingStatus layout="overlay" message="Opening…" />);

    expect(screen.getByRole('status')).toHaveClass('absolute');
    expect(screen.getByRole('status')).toHaveTextContent('Opening…');
  });
});