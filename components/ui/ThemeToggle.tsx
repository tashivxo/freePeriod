'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/providers/theme';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-text-secondary hover:bg-muted hover:text-text-primary transition-[transform,opacity,colors] active:scale-[0.96]"
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
