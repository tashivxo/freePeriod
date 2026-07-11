import { render, screen } from '@/lib/test-utils';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  describe('btn-shine glare animation', () => {
    it('default variant has btn-shine class', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-shine');
    });

    it('default variant has overflow-hidden class', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveClass('overflow-hidden');
    });

    it('outline variant has btn-shine class', () => {
      render(<Button variant="outline">Click me</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-shine');
    });

    it('outline variant has overflow-hidden class', () => {
      render(<Button variant="outline">Click me</Button>);
      expect(screen.getByRole('button')).toHaveClass('overflow-hidden');
    });

    it('secondary variant has btn-shine class', () => {
      render(<Button variant="secondary">Click me</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-shine');
    });

    it('ghost variant does NOT have btn-shine class', () => {
      render(<Button variant="ghost">Click me</Button>);
      expect(screen.getByRole('button')).not.toHaveClass('btn-shine');
    });
  });
});
