'use client';

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import Link from 'next/link';
import { Ellipsis } from 'lucide-react';
import { BookTextIcon } from '@/components/ui/icons/book-text';
import { ClockIcon } from '@/components/ui/icons/clock';
import { DeleteIcon } from '@/components/ui/icons/delete';
import { SendIcon } from '@/components/ui/icons/send';
import { SquarePenIcon } from '@/components/ui/icons/square-pen';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { Button } from '@/components/ui/Button';
import { PendingStatus } from '@/components/ui/pending-status';
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
import { formatDurationShort } from '@/lib/i18n/format';
import { formatGradeLabel } from '@/lib/utils/grades';
import { useT } from '@/providers/locale';
import { LessonCardDeleteOverlay } from '@/features/lesson/components/LessonCardDeleteOverlay';
import {
  LESSON_TITLE_MAX_LENGTH,
  RenameLessonDialog,
} from '@/features/lesson/components/RenameLessonDialog';
import { ShareLessonDialog } from '@/features/lesson/components/ShareLessonDialog';
import type { LessonPlan } from '@/types';

export type LessonPlanCardData = Pick<
  LessonPlan,
  'id' | 'title' | 'subject' | 'grade' | 'duration_minutes' | 'created_at'
> & {
  firstObjective?: string | null;
};

export { LESSON_TITLE_MAX_LENGTH };

function isInAppLessonLinkClick(event: React.MouseEvent<HTMLAnchorElement>): boolean {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  return true;
}

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
  showOwnerMenu: boolean;
  canDelete: boolean;
  onRename: () => void;
  onShare: () => void;
  onDelete: () => void;
};

/** One set of actions, rendered by both the right-click menu and the "..." button menu. */
function LessonMenuItems({
  Item,
  Separator,
  canRename,
  showOwnerMenu,
  canDelete,
  onRename,
  onShare,
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
      {showOwnerMenu && (
        <Item onSelect={onShare}>
          <MotionSafeIcon icon={SendIcon} size={16} parentHover parentFocus />
          {t('history.share')}
        </Item>
      )}
      {(canRename || showOwnerMenu) && canDelete && <Separator />}
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

export function LessonPlanCard({
  lesson,
  onDelete,
  onRename,
  showObjective = false,
}: LessonPlanCardProps) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const [opening, setOpening] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const renameSavingRef = useRef(false);
  const actionsRef = useRef<HTMLButtonElement>(null);
  const keepFocusRef = useRef(false);

  const canRename = Boolean(onRename);
  const canDelete = Boolean(onDelete);
  const showOwnerMenu = canRename || canDelete;

  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => cancelRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [confirming]);

  useEffect(() => {
    const clearOpening = () => setOpening(false);

    const handlePageShow = () => {
      clearOpening();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        clearOpening();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

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

  const startShare = () => {
    keepFocusRef.current = true;
    setSharing(true);
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

  const showOpeningOverlay = opening && !confirming;

  const card = (
    <Card
      className="group relative border-border/60 bg-surface shadow-sm hover:shadow-md transition-shadow h-full"
      aria-busy={opening || undefined}
    >
      <CardContent className="p-5">
        <Link
          href={`/lesson/${lesson.id}`}
          className="block"
          inert={confirming || opening || undefined}
          onClick={(event) => {
            if (confirming) return;
            if (!isInAppLessonLinkClick(event)) return;
            setOpening(true);
          }}
          onNavigate={() => {
            if (confirming) return;
            setOpening(true);
          }}
        >
          <h3
            className={`font-display text-base font-semibold text-text-primary group-hover:text-coral transition-colors line-clamp-2 mb-2 ${showOwnerMenu ? 'pe-12' : ''}`}
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

        {showOwnerMenu && (
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
                  showOwnerMenu={showOwnerMenu}
                  canDelete={canDelete}
                  onRename={startRename}
                  onShare={startShare}
                  onDelete={startDelete}
                />
              </DropdownMenuContent>
            </DropdownMenu>

            {confirming ? (
              <LessonCardDeleteOverlay
                lessonTitle={lesson.title}
                deleteFailed={deleteFailed}
                deleting={deleting}
                cancelRef={cancelRef}
                onCancel={closeConfirm}
                onConfirm={handleDeleteConfirm}
                onDismissEscape={closeConfirm}
              />
            ) : null}
          </>
        )}

        {showOpeningOverlay ? (
          <PendingStatus layout="overlay" message={t('history.openingLesson')} />
        ) : null}
      </CardContent>
    </Card>
  );

  if (!showOwnerMenu) return card;

  return (
    <>
      <ContextMenu modal={false} onOpenChange={handleMenuOpenChange}>
        <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
        <ContextMenuContent onCloseAutoFocus={handleMenuCloseAutoFocus}>
          <LessonMenuItems
            {...contextParts}
            canRename={canRename}
            showOwnerMenu={showOwnerMenu}
            canDelete={canDelete}
            onRename={startRename}
            onShare={startShare}
            onDelete={startDelete}
          />
        </ContextMenuContent>
      </ContextMenu>

      {canRename ? (
        <RenameLessonDialog
          open={renaming}
          onOpenChange={setRenaming}
          lessonTitle={lesson.title}
          onSave={handleRenameSave}
          savingRef={renameSavingRef}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            actionsRef.current?.focus();
          }}
        />
      ) : null}

      {showOwnerMenu ? (
        <ShareLessonDialog
          open={sharing}
          onOpenChange={setSharing}
          lessonId={lesson.id}
          lessonTitle={lesson.title}
        />
      ) : null}
    </>
  );
}