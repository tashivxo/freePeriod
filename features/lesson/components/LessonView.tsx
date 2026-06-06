'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { animate, stagger, remove } from 'animejs';
import { ArrowLeft, Download, Clock, BookOpen } from 'lucide-react';
import { contentToString } from '@/lib/lesson/content';
import { LESSON_VIEW_SECTIONS } from '@/lib/lesson/sections';
import { downloadBlob } from '@/lib/download-blob';
import { buildExportFilename } from '@/lib/export/filename';
import { useDebouncedLessonSave } from '@/lib/hooks/useDebouncedLessonSave';
import { SectionCard } from '@/features/lesson/components/SectionCard';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { LessonPlan } from '@/types';
import { BlurText } from '@/components/ui/BlurText';

type LessonViewProps = {
  lesson: LessonPlan;
};

export function LessonView({ lesson: initialLesson }: LessonViewProps) {
  const router = useRouter();
  const [lesson, setLesson] = useState(initialLesson);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<'docx' | 'pdf' | null>(null);
  const [fillLoading, setFillLoading] = useState(false);
  const [showNoPdfFieldsDialog, setShowNoPdfFieldsDialog] = useState(false);

  const debouncedSave = useDebouncedLessonSave(lesson.id, lesson.content, (updatedContent) => {
    setLesson((prev) => ({ ...prev, content: updatedContent }));
  });

  useEffect(() => {
    if (!cardsRef.current) return;

    const cards = Array.from(cardsRef.current.children);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) return;

    cards.forEach((el) => ((el as HTMLElement).style.opacity = '0'));

    animate(cards, {
      translateY: [16, 0],
      opacity: [0, 1],
      delay: stagger(60),
      duration: 400,
      easing: 'easeOutQuad',
    });

    return () => {
      cards.forEach((el) => remove(el));
    };
  }, []);

  const handleExport = useCallback(
    async (format: 'docx' | 'pdf') => {
      setExportLoading(format);
      try {
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: lesson.id, format }),
        });

        if (!response.ok) return;

        downloadBlob(await response.blob(), buildExportFilename(lesson.subject, format));
      } finally {
        setExportLoading(null);
      }
    },
    [lesson.id, lesson.subject],
  );

  const handleFillTemplate = useCallback(async () => {
    setFillLoading(true);
    try {
      const response = await fetch('/api/export/fill-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id }),
      });

      if (!response.ok) return;

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const json = (await response.json()) as { status?: string };
        if (json.status === 'no_fields') {
          setShowNoPdfFieldsDialog(true);
        }
        return;
      }

      const ext = lesson.template_path?.split('.').pop() ?? 'docx';
      downloadBlob(await response.blob(), `${lesson.title || 'lesson-plan'}-filled.${ext}`);
    } finally {
      setFillLoading(false);
    }
  }, [lesson.id, lesson.template_path, lesson.title]);

  const content = lesson.content;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-1 text-sm font-body text-text-secondary hover:text-coral transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <BlurText as="h1" text={content.title || lesson.title} className="font-display text-3xl font-bold text-text-primary mb-2" />

        <div className="flex flex-wrap items-center gap-4 text-sm font-body text-text-secondary">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {lesson.subject} · {lesson.grade}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {lesson.duration_minutes} min
          </span>
          {lesson.curriculum && (
            <span>{lesson.curriculum}</span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleExport('docx')}
            isLoading={exportLoading === 'docx'}
          >
            <Download className="h-4 w-4 mr-1" />
            Download DOCX
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleExport('pdf')}
            isLoading={exportLoading === 'pdf'}
          >
            <Download className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
          {lesson.template_path && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleFillTemplate}
              isLoading={fillLoading}
            >
              <Download className="h-4 w-4 mr-1" />
              Download Filled Template
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showNoPdfFieldsDialog} onOpenChange={setShowNoPdfFieldsDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>No fillable fields found</DialogTitle>
            <DialogDescription>
              This PDF template doesn&apos;t contain any form fields. Would you like to generate
              a fresh DOCX export instead?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t-0 bg-transparent p-0 pt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNoPdfFieldsDialog(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowNoPdfFieldsDialog(false);
                void handleExport('docx');
              }}
              isLoading={exportLoading === 'docx'}
            >
              Generate DOCX
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div ref={cardsRef} className="space-y-4">
        {LESSON_VIEW_SECTIONS.map((section) => (
          <div key={section.key} className="section-card">
            <SectionCard
              title={section.label}
              content={contentToString(content[section.key])}
              isEditing={editingKey === section.key}
              onEdit={() => setEditingKey(section.key)}
              onDone={() => setEditingKey(null)}
              onChange={(html) => debouncedSave(section.key, html)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
