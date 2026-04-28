'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import {
  Bold,
  Italic,
  Heading3,
  List,
  ListOrdered,
  Undo2,
  Redo2,
} from 'lucide-react';

type LessonEditorProps = {
  content: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
};

type ToolbarButtonProps = {
  onClick: () => void;
  isActive?: boolean;
  ariaLabel: string;
  disabled?: boolean;
  children: React.ReactNode;
};

function ToolbarButton({ onClick, isActive, ariaLabel, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={[
        'flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md px-2 transition-colors',
        isActive
          ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-text-primary)]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function LessonEditor({ content, onChange, onBlur }: LessonEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Typography],
    content,
    onUpdate({ editor: e }) {
      onChange(e.getHTML());
    },
    onBlur() {
      onBlur?.();
    },
  });

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex flex-wrap gap-0.5 border-b border-[var(--color-border)] px-2 py-1"
      >
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          isActive={editor?.isActive('bold')}
          ariaLabel="Bold"
        >
          <Bold className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          isActive={editor?.isActive('italic')}
          ariaLabel="Italic"
        >
          <Italic className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor?.isActive('heading', { level: 3 })}
          ariaLabel="Heading 3"
        >
          <Heading3 className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          isActive={editor?.isActive('bulletList')}
          ariaLabel="Bullet list"
        >
          <List className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          isActive={editor?.isActive('orderedList')}
          ariaLabel="Ordered list"
        >
          <ListOrdered className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>

        <div className="mx-1 w-px self-stretch bg-[var(--color-border)]" aria-hidden="true" />

        <ToolbarButton
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().chain().focus().undo().run()}
          ariaLabel="Undo"
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().chain().focus().redo().run()}
          ariaLabel="Redo"
        >
          <Redo2 className="h-4 w-4" aria-hidden="true" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-4 py-3 min-h-[120px] focus-within:outline-none
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror]:text-[var(--color-text-primary)]
          [&_.ProseMirror_p]:my-1
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5
          [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:my-2"
      />
    </div>
  );
}
