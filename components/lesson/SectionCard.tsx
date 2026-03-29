'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { animate } from 'animejs';
import { ChevronDown, Pencil, Check, X } from 'lucide-react';
import type { LessonSection } from '@/types/database';
import type { LessonSectionKey } from '@/types/lesson';
import { Button } from '@/components/ui/Button';

type SectionCardProps = {
  sectionKey: LessonSectionKey;
  label: string;
  content: LessonSection[LessonSectionKey];
  lessonId: string;
  onSave: (key: LessonSectionKey, value: unknown) => Promise<boolean>;
};

function renderContent(content: unknown): React.ReactNode {
  if (typeof content === 'string') {
    return <p className="font-body text-text-primary whitespace-pre-wrap">{content}</p>;
  }

  if (Array.isArray(content)) {
    return (
      <ul className="list-disc pl-5 space-y-1">
        {content.map((item, i) => (
          <li key={i} className="font-body text-text-primary">
            {typeof item === 'string' ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (content && typeof content === 'object') {
    const obj = content as Record<string, unknown>;
    return (
      <div className="space-y-3">
        {Object.entries(obj).map(([key, value]) => (
          <div key={key}>
            <h4 className="text-sm font-display font-semibold text-text-secondary capitalize mb-1">
              {key}
            </h4>
            {renderContent(value)}
          </div>
        ))}
      </div>
    );
  }

  return <p className="font-body text-text-primary">{String(content)}</p>;
}

function contentToEditText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.join('\n');
  return JSON.stringify(content, null, 2);
}

function editTextToContent(text: string, original: unknown): unknown {
  if (typeof original === 'string') return text;
  if (Array.isArray(original)) {
    return text.split('\n').filter((line) => line.trim().length > 0);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function SectionCard({ sectionKey, label, content, lessonId, onSave }: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleEdit = useCallback(() => {
    setEditText(contentToEditText(content));
    setIsEditing(true);
    setIsOpen(true);
  }, [content]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const newValue = editTextToContent(editText, content);
    const success = await onSave(sectionKey, newValue);
    setIsSaving(false);

    if (success) {
      setIsEditing(false);
      setShowSaved(true);

      // Brief green flash
      if (cardRef.current) {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReduced) {
          animate(cardRef.current, {
            borderColor: ['#10B981', '#e5e7eb'],
            duration: 800,
            easing: 'easeOutQuad',
          });
        }
      }
      setTimeout(() => setShowSaved(false), 1500);
    }
  }, [editText, content, sectionKey, onSave]);

  return (
    <div
      ref={cardRef}
      className="rounded-xl border-2 border-text-secondary/20 bg-surface overflow-hidden transition-colors"
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-background/50 transition-colors"
        aria-expanded={isOpen}
      >
        <h3 className="font-display text-lg font-semibold text-text-primary">
          {label}
        </h3>
        <ChevronDown
          className={`h-5 w-5 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div ref={contentRef} className="px-5 pb-4 border-t border-text-secondary/10">
          {isEditing ? (
            <div className="mt-3 space-y-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                aria-label={`Edit ${label}`}
                rows={Math.min(20, editText.split('\n').length + 2)}
                className="w-full rounded-lg border-2 border-coral/50 bg-background px-4 py-3 font-body text-sm text-text-primary resize-y focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} isLoading={isSaving}>
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              {renderContent(content)}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center gap-1 text-xs font-body font-medium text-text-secondary hover:text-coral transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>
              {showSaved && (
                <p className="mt-1 text-xs text-success font-body">Saved!</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
