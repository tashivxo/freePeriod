import { render, screen } from '@/lib/test-utils';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the hero heading', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Lesson plans in seconds, not hours');
  });

  it('renders the hero description', () => {
    render(<HomePage />);
    expect(screen.getByText(/generates a complete, structured lesson plan/)).toBeInTheDocument();
  });
});
