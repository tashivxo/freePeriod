'use client';

import { ThemeToggle } from '@/components/ui/branding/ThemeToggle';

/** Round floating control on the trailing edge of app pages. */
export function AppFloatingButton() {
  return (
    <div data-testid="app-floating-button" className="fixed bottom-6 end-4 z-50">
      <ThemeToggle variant="icon" className="rounded-full shadow-lg" />
    </div>
  );
}
