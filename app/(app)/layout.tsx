import { Navbar } from '@/components/layout/Navbar';
import { AppFloatingButton } from '@/components/layout/AppFloatingButton';
import { ColorBendsBackground } from '@/components/ui/backgrounds/ColorBendsWrapper';
import { LessonEditingProvider } from '@/providers/lesson-editing';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <ColorBendsBackground />
      <LessonEditingProvider>
        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
        </div>
        <AppFloatingButton />
      </LessonEditingProvider>
    </div>
  );
}
