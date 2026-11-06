'use client';

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import Link from 'next/link';
import { Ellipsis } from 'lucide-react';
import { BookTextIcon } from '@/components/ui/icons/book-text';
import { ClockIcon } from '@/components/ui/icons/clock';
import { DeleteIcon } from '@/components/ui/icons/delete';
import { SquarePenIcon } from '@/components/ui/icons/square-pen';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDurationShort } from '@/lib/i18n/format';
import { formatGradeLabel } from '@/lib/utils/grades';
import { useT } from '@/providers/locale';
import type { LessonPlan } from '@/types';

export type LessonPlanCardData = Pick<
  LessonPlan,
  'id' | 'title' | 'subject' | 'grade' | 'duration_minutes' | 'created_at'
> & {
  firstObjective?: string | null;
};

/** Matches the longest title the generator produces; keeps cards readable. */
export const LESSON_TITLE_MAX_LENGTH = 200;

type LessonPlanCardProps = {
  lesson: LessonPlanCardData;
  onDelete?: (id: string) => void | Promise<void>;
  onRename?: (id: string, newTitle: string) => void | Promise<void>;
  showObjective?: boolean;
};

type MenuItemProps = {
  onSelect: () => void;
  variant?: 'default' | 'destructive';
  className?: string;
  children: ReactNode;
};

type MenuParts = {
  Item: ComponentType<MenuItemProps>;
  Separator: ComponentType;
};

type LessonMenuItemsProps = MenuParts & {
  canRename: boolean;
  canDelete: boolean;
  onRename: () => void;
  onDelete: () => void;
};

/** One set of actions, rendered by both the right-click menu and the "..." button menu. */
function LessonMenuItems({
  Item,
  Separator,
  canRename,
  canDelete,
  onRename,
  onDelete,
}: LessonMenuItemsProps) {
  const t = useT();
  return (
    <>
      {canRename && (
        <Item onSelect={onRename}>
          <MotionSafeIcon icon={SquarePenIcon} size={16} parentHover parentFocus />
          {t('history.rename')}
        </Item>
      )}
      {canRename && canDelete && <Separator />}
      {canDelete && (
        <Item variant="destructive" onSelect={onDelete}>
          <MotionSafeIcon icon={DeleteIcon} size={16} parentHover parentFocus />
          {t('history.delete')}
        </Item>
      )}
    </>
  );
}

const contextParts: MenuParts = {
  Item: ContextMenuItem as ComponentType<MenuItemProps>,
  Separator: ContextMenuSeparator as ComponentType,
};

const dropdownParts: MenuParts = {
  Item: DropdownMenuItem as ComponentType<MenuItemProps>,
  Separator: DropdownMenuSeparator as ComponentType,
};

type RenameFormProps = {
  initialTitle: string;
  onSave: (title: string) => void | Promise<void>;
};

function RenameForm({ initialTitle, onSave }: RenameFormProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const trimmed = draft.trim();
  const isBlank = trimmed.length === 0;
  const canSave = !isBlank && trimmed !== initialTitle && !saving;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setFailed(false);
    try {
      await onSave(trimmed);
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="rename-lesson-title"
          className="font-body text-sm font-medium text-text-primary"
        >
          {t('history.renameLabel')}
        </label>
        <input
          ref={inputRef}
          id="rename-lesson-title"
          type="text"
          value={draft}
          maxLength={LESSON_TITLE_MAX_LENGTH}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            setDraft(event.target.value);
            setFailed(false);
          }}
          aria-invalid={isBlank || failed || undefined}
          className="h-12 w-full rounded-xl border-2 border-border bg-surface px-3 text-base font-body text-text-primary hover:border-coral/60 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
        />
        {isBlank && (
          <p role="alert" className="font-body text-sm text-destructive">
            {t('history.titleRequired')}
          </p>
        )}
        {failed && (
          <p role="alert" className="font-body text-sm text-destructive">
            {t('history.renameError')}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t('lesson.cancel')}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={!canSave} isLoading={saving}>
          {t('lesson.save')}
        </Button>
      </div>
    </form>
  );
}

export function LessonPlanCard({
  lesson,
  onDelete,
  onRename,
  showObjective = false,
}: LessonPlanCardProps) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const renameSavingRef = useRef(false);
  const actionsRef = useRef<HTMLButtonElement>(null);
  // Menus return focus to their trigger on close; an action that opens its own surface keeps focus there.
  const keepFocusRef = useRef(false);

  const canRename = Boolean(onRename);
  const canDelete = Boolean(onDelete);
  const hasActions = canRename || canDelete;

  const cancelRef = useRef<HTMLButtonElement>(null);

  // Safe default: Cancel takes focus. Deferred so the closing menu's own focus handling cannot win.
  useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => cancelRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [confirming]);

  const handleDeleteConfirm = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteFailed(false);
    try {
      await onDelete?.(lesson.id);
      setConfirming(false);
    } catch {
      setDeleteFailed(true);
    } finally {
      setDeleting(false);
    }
  };

  const handleRenameSave = async (title: string) => {
    renameSavingRef.current = true;
    try {
      await onRename?.(lesson.id, title);
      renameSavingRef.current = false;
      setRenaming(false);
    } catch (error) {
      renameSavingRef.current = false;
      throw error;
    }
  };

  const closeConfirm = () => {
    setConfirming(false);
    setDeleteFailed(false);
  };

  const startRename = () => {
    keepFocusRef.current = true;
    setRenaming(true);
  };

  const startDelete = () => {
    keepFocusRef.current = true;
    setDeleteFailed(false);
    setConfirming(true);
  };

  const handleMenuOpenChange = (open: boolean) => {
    if (open) keepFocusRef.current = false;
  };

  const handleMenuCloseAutoFocus = (event: Event) => {
    if (keepFocusRef.current) {
      event.preventDefault();
      keepFocusRef.current = false;
    }
  };

  const card = (
    <Card className="group relative border-border/60 bg-surface shadow-sm hover:shadow-md transition-shadow h-full">
      <CardContent className="p-5">
        <Link
          href={`/lesson/${lesson.id}`}
          className="block"
          inert={confirming || undefined}
        >
          <h3
            className={`font-display text-base font-semibold text-text-primary group-hover:text-coral transition-colors line-clamp-2 mb-2 ${hasActions ? 'pe-12' : ''}`}
          >
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
              {formatDurationShort(lesson.duration_minutes, t)}
            </span>
            <span>{formatGradeLabel(lesson.grade, t)}</span>
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

        {hasActions && (
          <>
            <DropdownMenu modal={false} onOpenChange={handleMenuOpenChange}>
              <DropdownMenuTrigger asChild>
                <Button
                  ref={actionsRef}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 end-2 text-text-secondary opacity-100 sm:opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                  aria-label={t('history.actionsAria', { title: lesson.title })}
                >
                  <Ellipsis aria-hidden className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onCloseAutoFocus={handleMenuCloseAutoFocus}>
                <LessonMenuItems
                  {...dropdownParts}
                  canRename={canRename}
                  canDelete={canDelete}
                  onRename={startRename}
                  onDelete={startDelete}
                />
              </DropdownMenuContent>
            </DropdownMenu>

            {confirming && (
              <div
                role="alertdialog"
                aria-label={t('history.deleteConfirm', { title: lesson.title })}
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface"
                onContextMenu={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.stopPropagation();
                    closeConfirm();
                  }
                }}
              >
                <div className="px-4 text-center">
                  <p className="mb-3 text-sm font-body text-text-primary">
                    {t('history.deleteConfirm', { title: lesson.title })}
                  </p>
                  {deleteFailed && (
                    <p role="alert" className="mb-3 text-sm font-body text-destructive">
                      {t('history.deleteError')}
                    </p>
                  )}
                  <div className="flex justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      ref={cancelRef}
                      onClick={closeConfirm}
                      className="h-auto min-h-11 px-4 py-2.5 text-xs sm:h-auto sm:min-h-0"
                    >
                      {t('lesson.cancel')}
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleDeleteConfirm}
                      isLoading={deleting}
                      className="h-auto min-h-11 px-4 py-2.5 text-xs sm:h-auto sm:min-h-0 bg-red-700 text-white hover:bg-red-800"
                    >
                      {t('history.delete')}
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

  if (!hasActions) return card;

  return (
    <>
      <ContextMenu modal={false} onOpenChange={handleMenuOpenChange}>
        <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
        <ContextMenuContent onCloseAutoFocus={handleMenuCloseAutoFocus}>
          <LessonMenuItems
            {...contextParts}
            canRename={canRename}
            canDelete={canDelete}
            onRename={startRename}
            onDelete={startDelete}
          />
        </ContextMenuContent>
      </ContextMenu>

      {canRename && (
        <Dialog
          open={renaming}
          onOpenChange={(open) => {
            // A save in flight owns the dialog; closing it would orphan the request's result.
            if (!open && renameSavingRef.current) return;
            setRenaming(open);
          }}
        >
          <DialogContent
            showCloseButton={false}
            className="gap-5 p-6 sm:max-w-md"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              actionsRef.current?.focus();
            }}
          >
            <div className="flex flex-col gap-1">
              <DialogTitle className="font-display text-lg font-semibold">
                {t('history.renameDialogTitle')}
              </DialogTitle>
              <DialogDescription className="sr-only">{lesson.title}</DialogDescription>
            </div>
            <RenameForm initialTitle={lesson.title} onSave={handleRenameSave} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
