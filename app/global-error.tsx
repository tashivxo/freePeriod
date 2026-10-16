'use client';

import { useEffect } from 'react';
import { DEFAULT_LOCALE, getMessages, isLocale, isRtl, type Locale } from '@/lib/i18n';
import './globals.css';

// Replaces the root layout when the layout itself crashes, so no providers here:
// read the locale cookie directly and keep the markup self-contained.
function cookieLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const raw = document.cookie.match(/(?:^|;\s*)fp-locale=([^;]*)/)?.[1];
  try {
    const decoded = raw ? decodeURIComponent(raw) : '';
    return isLocale(decoded) ? decoded : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = cookieLocale();
  const t = getMessages(locale).status;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale} dir={isRtl(locale) ? 'rtl' : 'ltr'}>
      <body className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md">
          <h1 className="mb-3 text-2xl font-bold text-text-primary">{t.errorTitle}</h1>
          <p className="mb-8 text-base leading-relaxed text-text-secondary">{t.errorBody}</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-coral px-6 py-3 font-semibold text-white hover:bg-coral-dark"
            >
              {t.tryAgain}
            </button>
            {/* plain <a> on purpose: a full reload is the safest recovery when the layout crashed */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="rounded-xl border border-border px-6 py-3 font-semibold text-text-primary">
              {t.backHome}
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
