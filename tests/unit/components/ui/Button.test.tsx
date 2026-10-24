import { render, screen } from '@/tests/helpers';
import { Button, buttonVariants } from '@/components/ui/Button';
import { FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL } from '@/lib/export/copy';

function variantClasses(variant: string) {
  return buttonVariants({
    variant: variant as 'default',
  });
}

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

  describe('export toolbar variants', () => {
    it('uses solid coral hover on the default variant instead of translucent primary/80', () => {
      const classes = variantClasses('default');
      expect(classes).toContain('hover:bg-coral-dark');
      expect(classes).toContain('dark:hover:bg-coral-light');
      expect(classes).not.toContain('hover:bg-primary/80');
    });

    it('uses the secondary-hover token instead of translucent secondary/80', () => {
      const classes = variantClasses('secondary');
      expect(classes).toContain('hover:bg-secondary-hover');
      expect(classes).not.toContain('hover:bg-secondary/80');
    });

    it('renders accent as solid mustard for Download as the primary action', () => {
      render(
        <Button variant={'accent' as 'default'}>{FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL}</Button>,
      );
      const button = screen.getByRole('button', { name: FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL });
      expect(button).toHaveAttribute('data-variant', 'accent');
      expect(button).toHaveClass('bg-accent', 'text-accent-foreground', 'btn-shine');
      expect(variantClasses('accent')).toContain('hover:bg-mustard-dark');
      expect(variantClasses('accent')).toContain('dark:hover:bg-mustard-light');
      expect(variantClasses('accent')).not.toContain('dark:hover:bg-mustard-dark');
    });

    it('renders soft as muted coral with the coral-800 border for Fill as the secondary action', () => {
      render(<Button variant={'soft' as 'default'}>Fill my template</Button>);
      const button = screen.getByRole('button', { name: /fill my template/i });
      expect(button).toHaveAttribute('data-variant', 'soft');
      expect(button).toHaveClass('bg-primary-soft', 'border-coral-800', 'btn-shine');
      expect(variantClasses('soft')).toContain('hover:bg-primary-soft-hover');
    });
  });

  describe('asChild', () => {
    it('renders a single child element without extra slot children', () => {
      render(
        <Button asChild>
          <a href="/generate">New Lesson Plan</a>
        </Button>,
      );

      const link = screen.getByRole('link', { name: 'New Lesson Plan' });
      expect(link).toHaveAttribute('data-slot', 'button');
      expect(link).toHaveClass('btn-shine');
    });
  });

  describe('loading state', () => {
    it('marks the button busy and disabled while loading', () => {
      render(<Button isLoading>Save</Button>);
      const button = screen.getByRole('button', { name: /save/i });
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
      expect(button.querySelector('svg.animate-spin')).toHaveAttribute('aria-hidden', 'true');
    });

    it('stays disabled while loading even when the caller passes disabled={false}', () => {
      render(
        <Button isLoading disabled={false}>
          Send
        </Button>,
      );
      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('has no busy state or spinner when not loading', () => {
      render(<Button>Idle</Button>);
      const button = screen.getByRole('button', { name: /idle/i });
      expect(button).not.toHaveAttribute('aria-busy');
      expect(button).toBeEnabled();
      expect(button.querySelector('svg.animate-spin')).toBeNull();
    });
  });
});
