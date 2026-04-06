'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-text-secondary hover:bg-muted hover:text-text-primary transition-colors focus-visible:outline-2 focus-visible:outline-coral"
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4.5 w-4.5" />
      ) : (
        <Moon className="h-4.5 w-4.5" />
      )}
    </button>
  );
}
