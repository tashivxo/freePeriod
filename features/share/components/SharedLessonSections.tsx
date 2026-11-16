import { SectionValueView } from '@/features/lesson/components/SectionValueView';
import { contentToEditorHtml, isRecord } from '@/lib/lesson/content';
import { LESSON_VIEW_SECTIONS } from '@/lib/lesson/sections';
import type { LessonSection } from '@/types';

const PROSE_CLASS =
  'font-body text-text-primary prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h3]:font-semibold [&_h3]:text-base [&_p]:my-1';

type SharedLessonSectionsProps = {
  content: LessonSection;
};

export function SharedLessonSections({ content }: SharedLessonSectionsProps) {
  return (
    <div className="space-y-4">
      {LESSON_VIEW_SECTIONS.map((section) => {
        const value = content[section.key];
        const viewContent = isRecord(value) ? (
          <SectionValueView value={value} />
        ) : (
          <div
            className={PROSE_CLASS}
            dangerouslySetInnerHTML={{ __html: contentToEditorHtml(value) }}
          />
        );

        return (
          <article
            key={section.key}
            className="section-card rounded-xl border border-border/60 bg-surface shadow-sm"
          >
            <div className="px-5 pt-4 pb-2">
              <h2 className="font-display text-lg font-semibold text-text-primary">{section.label}</h2>
            </div>
            <div className="border-t border-text-secondary/10 px-5 pb-4 pt-3">{viewContent}</div>
          </article>
        );
      })}
    </div>
  );
}