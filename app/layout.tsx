import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const GrainOverlay = dynamic(
  () => import('@/components/animations/GrainOverlay').then((m) => m.GrainOverlay),
  { ssr: false }
);
import { Plus_Jakarta_Sans, DM_Sans, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'FreePeriod — AI Lesson Planner',
  description: 'AI lesson planner for teachers. Describe what you need and get a complete, structured lesson plan in seconds. Export to DOCX or PDF.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(plusJakartaSans.variable, dmSans.variable, "font-sans", geist.variable)}>
      <body><TooltipProvider>{children}</TooltipProvider><GrainOverlay /></body>
    </html>
  );
}

