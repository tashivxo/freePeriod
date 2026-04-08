import { Navbar } from '@/components/layout/Navbar';
import { ColorBendsBackground } from '@/components/animations/ColorBendsBackground';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <ColorBendsBackground />
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
