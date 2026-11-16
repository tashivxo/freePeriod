import type { ReactNode } from 'react';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type LessonDialogChromeProps = {
  title: ReactNode;
  description: ReactNode;
  descriptionClassName?: string;
};

/** Shared title block for lesson Rename and Share dialogs. */
export function LessonDialogChrome({
  title,
  description,
  descriptionClassName = 'font-body text-sm text-text-secondary',
}: LessonDialogChromeProps) {
  return (
    <DialogHeader className="gap-1 text-start sm:text-start">
      <DialogTitle className="font-display text-lg font-semibold text-text-primary">{title}</DialogTitle>
      <DialogDescription className={descriptionClassName}>{description}</DialogDescription>
    </DialogHeader>
  );
}