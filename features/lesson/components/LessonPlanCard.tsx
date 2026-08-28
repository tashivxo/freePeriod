'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookTextIcon } from '@/components/ui/icons/book-text';
import { ClockIcon } from '@/components/ui/icons/clock';
import { DeleteIcon } from '@/components/ui/icons/delete';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { formatGradeLabel } from '@/lib/utils/grades';
import type { LessonPlan } from '@/types';

export type LessonPlanCardData = Pick<
  LessonPlan,
  'id' | 'title' | 'subject' | 'grade' | 'duration_minutes' | 'created_at'
> & {
  firstObjective?: string | null;
};

type LessonPlanCardProps = {
  lesson: LessonPlanCardData;
  onDelete?: (id: string) => void | Promise<void>;
  showObjective?: boolean;
};

export function LessonPlanCard({ lesson, onDelete, showObjective = false }: LessonPlanCardProps) {
  const [confirming, setConfirming] = useState(false);

  const handleDeleteConfirm = async () => {
    await onDelete?.(lesson.id);
    setConfirming(false);
  };

  return (
    <Card className="group relative border-border/60 bg-surface shadow-sm hover:shadow-md transition-shadow h-full">
      <CardContent className="p-5">
        <Link href={`/lesson/${lesson.id}`} className="block">
          <h3 className="font-display text-base font-semibold text-text-primary group-hover:text-coral transition-colors line-clamp-2 mb-2">
            {lesson.title}
          </h3>
          <div
            className={`flex items-center gap-3 text-xs font-body text-text-secondary ${showObjective ? 'mb-3' : 'mb-1'}`}
          >
            <span className="inline-flex items-center gap-1">
              <MotionSafeIcon icon={BookTextIcon} size={12} />
              {lesson.subject}
            </span>
            <span className="inline-flex items-center gap-1">
              <MotionSafeIcon icon={ClockIcon} size={12} />
              {lesson.duration_minutes}m
            </span>
            <span>{formatGradeLabel(lesson.grade)}</span>
          </div>
          {showObjective && lesson.firstObjective && (
            <p className="text-xs font-body text-text-secondary line-clamp-2">
              {lesson.firstObjective}
            </p>
          )}
          <p
            className={
              showObjective
                ? 'mt-3 text-[10px] font-body text-text-secondary/60'
                : 'text-xs font-body text-text-secondary'
            }
          >
            {new Date(lesson.created_at).toLocaleDateString()}
          </p>
        </Link>

        {onDelete && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setConfirming(true)}
              className="absolute top-3 right-3 text-text-secondary/40 hover:text-red-500 opacity-0 max-md:opacity-100 group-hover:opacity-100 focus:opacity-100 [@media(pointer:coarse)]:opacity-100"
              aria-label={`Delete ${lesson.title}`}
            >
              <MotionSafeIcon icon={DeleteIcon} size={16} />
            </Button>

            {confirming && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface/95 backdrop-blur-sm">
                <div className="text-center px-4">
                  <p className="text-sm font-body text-text-primary mb-3">Delete this lesson?</p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleDeleteConfirm}
                      className="h-auto min-h-0 px-4 py-2.5 text-xs sm:h-auto sm:min-h-0 bg-red-500 text-white hover:bg-red-600"
                    >
                      Delete
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirming(false)}
                      className="h-auto min-h-0 px-4 py-2.5 text-xs sm:h-auto sm:min-h-0"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
