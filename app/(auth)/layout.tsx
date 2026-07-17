import { AuthBackground } from '@/components/animations/AuthBackground';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <AuthBackground />
      <div className="relative z-10">{children}</div>
    </main>
  );
}
