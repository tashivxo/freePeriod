'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon } from '@/components/ui/icons/home';
import { FilePenLineIcon } from '@/components/ui/icons/file-pen-line';
import { ClockIcon } from '@/components/ui/icons/clock';
import { SettingsIcon } from '@/components/ui/icons/settings';
import { Logo } from '@/components/ui/branding/Logo';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import type { AnimatedIconComponent } from '@/components/ui/icons/types';

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: AnimatedIconComponent;
}[] = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/generate', label: 'Generate', icon: FilePenLineIcon },
  { href: '/history', label: 'History', icon: ClockIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-border/60 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/dashboard" aria-label="FreePeriod home">
          <Logo size="sm" />
        </Link>

        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-label={label}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-body transition-colors ${
                    active
                      ? 'bg-coral/10 text-coral font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-muted'
                  }`}
                >
                  <MotionSafeIcon icon={icon} size={16} parentFocus />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
