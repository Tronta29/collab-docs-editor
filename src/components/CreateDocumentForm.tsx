"use client";

import { useActionState } from "react";
import { createDocument } from "@/lib/document-actions";

// On success the action redirects to the new document's editor.
export function CreateDocumentForm() {
  const [state, action, pending] = useActionState(createDocument, {});

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input
        name="title"
        placeholder="Untitled document"
        maxLength={200}
        aria-label="New document title"
        className="w-64 rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Creating…" : "New document"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
