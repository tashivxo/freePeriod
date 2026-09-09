import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { GrainOverlayClient } from '@/components/animations/GrainOverlayClient';
import { Manrope, Noto_Sans_Arabic, Noto_Sans_SC } from 'next/font/google';
import { DEFAULT_LOCALE, isLocale, isRtl, type Locale } from '@/lib/i18n';
import { LocaleProvider } from '@/providers/locale';
import { ThemeProvider } from '@/providers/theme';
import { ZenModeProvider } from '@/providers/zen-mode';
import './globals.css';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-noto-sans-arabic',
  weight: ['400', '500', '600', '700'],
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-sans-sc',
  weight: ['400', '500', '600', '700'],
  // next/font only exposes latin for this family; the files still cover Hans glyphs.
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://freeperiod.co.za'),
  title: 'FreePeriod — AI Lesson Planner',
  description:
    'AI lesson planner for teachers. Describe what you need and get a complete, structured lesson plan in seconds. Export to DOCX.',
};

const localeBootstrapScript = `
  (() => {
    try {
      const storedTheme = localStorage.getItem('fp-theme');
      const theme = storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system'
        ? storedTheme
        : 'light';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    } catch {}
    const locales = ['en', 'ar', 'es', 'fr', 'zh-Hans'];
    let locale = document.cookie.match(/(?:^|;\\s*)fp-locale=([^;]*)/)?.[1];
    try {
      locale = locale ? decodeURIComponent(locale) : undefined;
    } catch {
      locale = undefined;
    }
    if (!locales.includes(locale)) {
      try {
        locale = localStorage.getItem('fp-locale') || undefined;
      } catch {}
    }
    if (locales.includes(locale)) {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
      if (!document.cookie.match(/(?:^|;\\s*)fp-locale=/)) {
        document.cookie = 'fp-locale=' + encodeURIComponent(locale) + '; path=/; max-age=31536000; SameSite=Lax';
      }
    }
  })();
`;

async function readLocaleCookie(): Promise<Locale> {
  const raw = (await cookies()).get('fp-locale')?.value;
  if (!raw) return DEFAULT_LOCALE;
  try {
    const decoded = decodeURIComponent(raw);
    return isLocale(decoded) ? decoded : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await readLocaleCookie();

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? 'rtl' : 'ltr'}
      suppressHydrationWarning
      className={cn(manrope.variable, notoSansArabic.variable, notoSansSC.variable)}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: localeBootstrapScript }} />
        <LocaleProvider initialLocale={locale}>
          <ThemeProvider>
            <ZenModeProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </ZenModeProvider>
          </ThemeProvider>
        </LocaleProvider>
        <GrainOverlayClient />
      </body>
    </html>
  );
}
