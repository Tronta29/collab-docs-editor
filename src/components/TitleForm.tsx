"use client";

import { useActionState, useRef } from "react";
import type { ActionState } from "@/lib/action-state";
import { renameDocument } from "@/lib/document-actions";

// Owner-only. Shared users see a plain heading instead (see the editor page).
// Saves on Enter (native form submit), on blur, and via the Rename button, so an edited
// title is never silently lost.
export function TitleForm({ id, title }: { id: string; title: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const lastSaved = useRef(title);

  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await renameDocument(prev, fd);
    if (result.ok) lastSaved.current = String(fd.get("title") ?? "").trim();
    return result;
  }, {});

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="title"
        defaultValue={title}
        maxLength={200}
        aria-label="Document title"
        onBlur={(e) => {
          // Empty counts as a change too, so the "can't be empty" error shows instead of silently reverting.
          if (e.currentTarget.value.trim() !== lastSaved.current) formRef.current?.requestSubmit();
        }}
        className="min-w-0 flex-1 rounded border border-transparent px-2 py-1 text-2xl font-semibold hover:border-gray-300 focus:border-gray-400"
      />
      <button
        type="submit"
        disabled={pending}
        // Don't blur the input first, or the blur handler would submit a second time.
        onMouseDown={(e) => e.preventDefault()}
        className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-60"
      >
        {pending ? "Renaming…" : "Rename"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.ok && !pending && <p className="w-full text-sm text-green-700">Renamed.</p>}
    </form>
  );
}
