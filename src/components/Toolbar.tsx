"use client";

import { type Editor, useEditorState } from "@tiptap/react";
import { Bold, Heading1, Heading2, Heading3, Italic, List, ListOrdered, Pilcrow, Redo2, Underline, Undo2 } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "@/components/ui/IconButton";

const ICON = 17;

type ButtonProps = { label: string; icon: ReactNode; active?: boolean; disabled?: boolean; onClick: () => void };

function ToolbarButton({ label, icon, active, disabled, onClick }: ButtonProps) {
  return (
    <IconButton
      label={label}
      icon={icon}
      active={active}
      disabled={disabled}
      // Keep the editor selection: don't let the button steal focus on mousedown.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    />
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />;

export function Toolbar({ editor }: { editor: Editor }) {
  // Re-render only when one of these values changes (selection moves, marks toggle…).
  const s = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      paragraph: editor.isActive("paragraph"),
      h1: editor.isActive("heading", { level: 1 }),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });
  const run = () => editor.chain().focus();

  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5">
      <ToolbarButton label="Undo (Ctrl+Z)" icon={<Undo2 size={ICON} aria-hidden />} disabled={!s.canUndo} onClick={() => run().undo().run()} />
      <ToolbarButton label="Redo (Ctrl+Y)" icon={<Redo2 size={ICON} aria-hidden />} disabled={!s.canRedo} onClick={() => run().redo().run()} />
      <Divider />
      <ToolbarButton label="Bold (Ctrl+B)" icon={<Bold size={ICON} aria-hidden />} active={s.bold} onClick={() => run().toggleBold().run()} />
      <ToolbarButton label="Italic (Ctrl+I)" icon={<Italic size={ICON} aria-hidden />} active={s.italic} onClick={() => run().toggleItalic().run()} />
      <ToolbarButton label="Underline (Ctrl+U)" icon={<Underline size={ICON} aria-hidden />} active={s.underline} onClick={() => run().toggleUnderline().run()} />
      <Divider />
      <ToolbarButton label="Paragraph" icon={<Pilcrow size={ICON} aria-hidden />} active={s.paragraph} onClick={() => run().setParagraph().run()} />
      <ToolbarButton label="Heading 1" icon={<Heading1 size={ICON} aria-hidden />} active={s.h1} onClick={() => run().toggleHeading({ level: 1 }).run()} />
      <ToolbarButton label="Heading 2" icon={<Heading2 size={ICON} aria-hidden />} active={s.h2} onClick={() => run().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton label="Heading 3" icon={<Heading3 size={ICON} aria-hidden />} active={s.h3} onClick={() => run().toggleHeading({ level: 3 }).run()} />
      <Divider />
      <ToolbarButton label="Bulleted list" icon={<List size={ICON} aria-hidden />} active={s.bulletList} onClick={() => run().toggleBulletList().run()} />
      <ToolbarButton label="Numbered list" icon={<ListOrdered size={ICON} aria-hidden />} active={s.orderedList} onClick={() => run().toggleOrderedList().run()} />
    </div>
  );
}
