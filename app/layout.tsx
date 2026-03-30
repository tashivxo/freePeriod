import type { Metadata } from 'next';
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
  description: 'Generate structured lesson plans with AI. Upload curriculum docs, get formatted plans, export to DOCX/PDF.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(plusJakartaSans.variable, dmSans.variable, "font-sans", geist.variable)}>
      <body><TooltipProvider>{children}</TooltipProvider></body>
    </html>
  );
}

