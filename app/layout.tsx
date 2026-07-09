import type { Metadata } from 'next';
import { GrainOverlayClient } from '@/components/animations/GrainOverlayClient';
import { Manrope } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme';
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
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
        <GrainOverlayClient />
      </body>
    </html>
  );
}
