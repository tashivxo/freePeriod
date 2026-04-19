import { Navbar } from '@/components/layout/Navbar';
import { ColorBendsBackground } from '@/components/backgrounds/ColorBendsWrapper';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <ColorBendsBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
