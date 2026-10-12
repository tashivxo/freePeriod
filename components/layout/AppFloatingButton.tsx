'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/branding/ThemeToggle';
import { useLessonEditing } from '@/providers/lesson-editing';

/** Round floating control on the trailing edge of app pages. */
export function AppFloatingButton() {
  const { isEditing } = useLessonEditing();
  const pathname = usePathname();

  if (isEditing) return null;
  if (pathname === '/settings') return null;

  return (
    <div data-testid="app-floating-button" className="fixed bottom-6 end-4 z-50">
      <ThemeToggle variant="icon" className="rounded-full shadow-lg" />
    </div>
  );
}
