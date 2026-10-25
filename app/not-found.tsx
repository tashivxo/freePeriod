import type { Metadata } from 'next';
import { NotFoundView } from '@/components/layout/NotFoundView';
import { getMessages } from '@/lib/i18n';
import { readLocaleCookie } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocaleCookie();
  return { title: getMessages(locale).status.notFoundDocumentTitle };
}

export default function NotFound() {
  return <NotFoundView />;
}
