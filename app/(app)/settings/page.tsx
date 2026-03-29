import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { SettingsClient } from './SettingsClient';
import type { User } from '@/types/database';

export const metadata = { title: 'Settings — FreePeriod' };

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-pulse">
      <div className="h-8 w-32 bg-gray-200 rounded mb-8" />
      <div className="h-48 bg-gray-100 rounded-xl mb-8" />
      <div className="h-48 bg-gray-100 rounded-xl mb-8" />
      <div className="h-24 bg-gray-100 rounded-xl" />
    </div>
  );
}

async function SettingsContent() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (!profile) redirect('/sign-in');

  return <SettingsClient user={profile as User} />;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
