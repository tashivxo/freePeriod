'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { animate } from 'animejs';
import { ChevronDown, Pencil, Check } from 'lucide-react';
import { SUCCESS } from '@/lib/utils/brand-colors';

// Tiptap uses browser-only APIs — load it client-side only
const LessonEditor = dynamic(
  () => import('./LessonEditor').then((m) => ({ default: m.LessonEditor })),
  { ssr: false },
);

type SectionCardProps = {
  title: string;
  content: string;
  isEditing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onChange: (html: string) => void;
};

export function SectionCard({
  title,
  content,
  isEditing,
  onEdit,
  onDone,
  onChange,
}: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  // Brief green border flash when a save completes (triggered externally via isEditing → false)
  const flashSaved = () => {
    if (!cardRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const successColor =
      getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim() ||
      SUCCESS;
    const endColor = getComputedStyle(cardRef.current).borderColor;
    animate(cardRef.current, {
      borderColor: [successColor, endColor],
      duration: 800,
      easing: 'easeOutQuad',
    });
  };

  const handleDone = () => {
    onDone();
    flashSaved();
  };

  return (
    <div
      ref={cardRef}
      className="rounded-xl border-2 border-text-secondary/20 bg-surface overflow-hidden transition-colors"
    >
      {/* Header */}
      <div className="flex w-full items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-1 items-center gap-2 text-left hover:opacity-80 transition-opacity"
          aria-expanded={isOpen}
        >
          <h3 className="font-display text-lg font-semibold text-text-primary">{title}</h3>
          <ChevronDown
            className={`h-5 w-5 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              onEdit();
            }}
            aria-label={`Edit ${title}`}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-text-secondary hover:text-coral transition-colors"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDone}
            aria-label={`Done editing ${title}`}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-success hover:opacity-80 transition-opacity"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div className="px-5 pb-4 border-t border-text-secondary/10">
          {isEditing ? (
            <div className="mt-3">
              <LessonEditor content={content} onChange={onChange} onBlur={onDone} />
            </div>
          ) : (
            <div
              className="mt-3 font-body text-text-primary prose prose-sm max-w-none
                [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                [&_h3]:font-semibold [&_h3]:text-base [&_p]:my-1"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
      )}
    </div>
  );
}
