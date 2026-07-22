import { render, screen } from '@/lib/test-utils';
import { ShinyText } from './ShinyText';

describe('ShinyText', () => {
  it('renders the provided text', () => {
    render(<ShinyText text="Why Teachers Love FreePeriod" />);
    expect(screen.getByText('Why Teachers Love FreePeriod')).toBeInTheDocument();
  });

  it('uses the theme-aware highlight variable by default', () => {
    render(<ShinyText text="Save Hours Every Week" />);
    const text = screen.getByText('Save Hours Every Week');
    expect(text).toHaveStyle({ '--shine-color': 'var(--shiny-text-highlight)' });
  });

  it('allows overriding the highlight color', () => {
    render(<ShinyText text="Custom" shineColor="rgb(255, 0, 0)" />);
    expect(screen.getByText('Custom')).toHaveStyle({ '--shine-color': 'rgb(255, 0, 0)' });
  });
});