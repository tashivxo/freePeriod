import { Navbar } from '@/components/layout/Navbar';
import { AppFloatingButton } from '@/components/layout/AppFloatingButton';
import { ColorBendsBackground } from '@/components/ui/backgrounds/ColorBendsWrapper';
import { LessonEditingProvider } from '@/providers/lesson-editing';
import { ColorBendsAtmosphereProvider } from '@/providers/color-bends-atmosphere';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { country: string | null; default_curriculum: string | null } | null = null;

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('country, default_curriculum')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <div className="relative min-h-screen bg-background">
      <ColorBendsAtmosphereProvider
        initialCountry={profile?.country ?? null}
        initialCurriculum={profile?.default_curriculum ?? null}
      >
        <ColorBendsBackground />
        <LessonEditingProvider>
          <div className="relative z-10 flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
          <AppFloatingButton />
        </LessonEditingProvider>
      </ColorBendsAtmosphereProvider>
    </div>
  );
}
