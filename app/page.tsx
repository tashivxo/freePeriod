import Link from 'next/link';
import { PenLine, Download, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    icon: PenLine,
    title: 'Structured Plans',
    description: '12 sections covering objectives, activities, differentiation and assessment.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Claude generates plans tailored to your subject, grade and curriculum.',
  },
  {
    icon: Download,
    title: 'Export Anywhere',
    description: 'Download as DOCX or PDF. Edit inline before exporting.',
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-display text-lg font-bold text-coral">FreePeriod</span>
        <div className="flex gap-3">
          <Link
            href="/sign-in"
            className="rounded-lg px-4 py-2.5 text-sm font-body text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-coral px-4 py-2.5 text-sm font-body font-medium text-white hover:bg-coral/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      <main>
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-16 text-center">
        <h1 className="font-display text-5xl font-bold leading-tight text-text-primary sm:text-6xl">
          Lesson plans in{' '}
          <span className="text-coral">seconds</span>,{' '}
          not hours
        </h1>
        <p className="mt-6 font-body text-lg text-text-secondary max-w-xl mx-auto">
          Upload curriculum documents, describe what you need, and FreePeriod generates a
          complete, structured lesson plan you can edit and export.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-coral px-6 py-3 font-body font-medium text-white shadow-sm hover:bg-coral/90 transition-colors"
          >
            Start for free
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-surface px-6 py-3 font-body font-medium text-text-primary hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border border-gray-100 bg-surface p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-coral/10">
                <Icon className="h-6 w-6 text-coral" />
              </div>
              <h3 className="font-display text-lg font-semibold text-text-primary">{title}</h3>
              <p className="mt-2 font-body text-sm text-text-secondary">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      </main>

      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="font-body text-xs text-text-secondary">
          &copy; {new Date().getFullYear()} FreePeriod. Built for teachers.
        </p>
      </footer>
    </div>
  );
}
