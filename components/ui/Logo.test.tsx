import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders wordmark by default', () => {
    render(<Logo />);
    expect(screen.getByText('FreePeriod')).toBeInTheDocument();
  });

  it('renders pictogram image with correct src', () => {
    render(<Logo />);
    const img = document.querySelector('img');
    expect(img?.getAttribute('src')).toMatch(/brand(\/|%2F)pictogram\.png/);
  });

  it('uses accessible alt when showText is false', () => {
    render(<Logo showText={false} />);
    expect(screen.getByRole('img', { name: 'FreePeriod' })).toBeInTheDocument();
  });

  it('hides decorative image from accessibility tree when showText is true', () => {
    render(<Logo showText={true} />);
    const img = document.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('aria-hidden', 'true');
  });
});
