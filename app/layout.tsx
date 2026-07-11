import type { Metadata } from 'next';
import { GrainOverlayClient } from '@/components/animations/GrainOverlayClient';
import { Manrope } from 'next/font/google';
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

export const metadata: Metadata = {
  metadataBase: new URL('https://freeperiod.co.za'),
  title: 'FreePeriod — AI Lesson Planner',
  description:
    'AI lesson planner for teachers. Describe what you need and get a complete, structured lesson plan in seconds. Export to DOCX.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(manrope.variable)}>
      <body>
        <ThemeProvider>
          <ZenModeProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ZenModeProvider>
        </ThemeProvider>
        <GrainOverlayClient />
      </body>
    </html>
  );
}
