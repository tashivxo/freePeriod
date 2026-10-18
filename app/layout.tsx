import type { Metadata } from 'next';
import { GrainOverlayClient } from '@/components/animations/GrainOverlayClient';
import { Manrope, Noto_Sans_Arabic } from 'next/font/google';
import localFont from 'next/font/local';
import { isRtl } from '@/lib/i18n';
import { readLocaleCookie } from '@/lib/i18n/server';
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

const notoSansSC = localFont({
  src: [
    { path: './fonts/noto-sans-sc-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/noto-sans-sc-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/noto-sans-sc-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/noto-sans-sc-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  variable: '--font-noto-sans-sc',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://freeperiod.co.za'),
  title: 'FreePeriod | AI Lesson Planner',
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
