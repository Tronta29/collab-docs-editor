"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/action-state";
import { deleteDocument, renameDocument } from "@/lib/document-actions";

export function OwnerActions({ id, title }: { id: string; title: string }) {
  const [editing, setEditing] = useState(false);

  const [renameState, renameAction, renaming] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await renameDocument(prev, fd);
    if (result.ok) setEditing(false);
    return result;
  }, {});
  const [deleteState, deleteAction, deleting] = useActionState(deleteDocument, {});

  return (
    <div className="flex flex-col items-end gap-1">
      {editing ? (
        <form action={renameAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <input
            name="title"
            defaultValue={title}
            maxLength={200}
            autoFocus
            aria-label="Document title"
            className="w-48 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <button type="submit" disabled={renaming} className="text-sm text-blue-600 hover:underline disabled:opacity-60">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:underline">
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-3 text-sm">
          <button type="button" onClick={() => setEditing(true)} className="text-blue-600 hover:underline">
            Rename
          </button>
          <form
            action={deleteAction}
            onSubmit={(e) => {
              if (!confirm(`Delete "${title}"? This can't be undone.`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={id} />
            <button type="submit" disabled={deleting} className="text-red-600 hover:underline disabled:opacity-60">
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </form>
        </div>
      )}
      {(renameState.error || deleteState.error) && (
        <p className="text-xs text-red-600">{renameState.error ?? deleteState.error}</p>
      )}
    </div>
  );
}
