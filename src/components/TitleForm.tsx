"use client";

import { useActionState, useRef } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/action-state";
import { renameDocument } from "@/lib/document-actions";

// Owner-only. Shared users see a plain heading instead (see the editor page).
// A large, borderless field that saves on Enter and on blur, so an edited title is never lost.
// Validation errors (e.g. an empty title) stay inline; success is a quiet toast.
export function TitleForm({ id, title }: { id: string; title: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const lastSaved = useRef(title);

  const [state, action] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await renameDocument(prev, fd);
    if (result.ok) {
      lastSaved.current = String(fd.get("title") ?? "").trim();
      toast.success("Document renamed");
    }
    return result;
  }, {});

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="id" value={id} />
      <input
        name="title"
        defaultValue={title}
        maxLength={200}
        aria-label="Document title"
        aria-invalid={!!state.error}
        aria-describedby={state.error ? "title-error" : undefined}
        title="Click to rename"
        onBlur={(e) => {
          // Empty counts as a change too, so the "can't be empty" error shows instead of silently reverting.
          if (e.currentTarget.value.trim() !== lastSaved.current) formRef.current?.requestSubmit();
        }}
        className="-mx-2 w-[calc(100%+1rem)] truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-3xl font-semibold tracking-tight text-zinc-900 transition-colors placeholder:text-zinc-400 hover:border-zinc-300 hover:bg-white focus:border-accent focus:bg-white"
      />
      {state.error && (
        <p id="title-error" role="alert" className="mt-1 text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
