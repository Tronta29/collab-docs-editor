"use client";

import { type Editor, useEditorState } from "@tiptap/react";
import type { ReactNode } from "react";

type ButtonProps = {
  label: ReactNode;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function ToolbarButton({ label, title, active, disabled, onClick }: ButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // Keep the editor selection: don't let the button steal focus on mousedown.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`min-w-8 rounded px-2 py-1 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:text-gray-400 ${
        active
          ? "bg-gray-900 text-white"
          : "text-gray-800 enabled:hover:bg-gray-100 enabled:hover:text-gray-950"
      }`}
    >
      {label}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden />;

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
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 p-2 text-gray-800">
      <ToolbarButton label={<strong>B</strong>} title="Bold" active={s.bold} onClick={() => run().toggleBold().run()} />
      <ToolbarButton label={<em>I</em>} title="Italic" active={s.italic} onClick={() => run().toggleItalic().run()} />
      <ToolbarButton label={<u>U</u>} title="Underline" active={s.underline} onClick={() => run().toggleUnderline().run()} />
      <Divider />
      <ToolbarButton label="¶" title="Paragraph" active={s.paragraph} onClick={() => run().setParagraph().run()} />
      <ToolbarButton label="H1" title="Heading 1" active={s.h1} onClick={() => run().toggleHeading({ level: 1 }).run()} />
      <ToolbarButton label="H2" title="Heading 2" active={s.h2} onClick={() => run().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton label="H3" title="Heading 3" active={s.h3} onClick={() => run().toggleHeading({ level: 3 }).run()} />
      <Divider />
      <ToolbarButton label="• List" title="Bulleted list" active={s.bulletList} onClick={() => run().toggleBulletList().run()} />
      <ToolbarButton label="1. List" title="Numbered list" active={s.orderedList} onClick={() => run().toggleOrderedList().run()} />
      <Divider />
      <ToolbarButton label="↶" title="Undo" disabled={!s.canUndo} onClick={() => run().undo().run()} />
      <ToolbarButton label="↷" title="Redo" disabled={!s.canRedo} onClick={() => run().redo().run()} />
    </div>
  );
}
