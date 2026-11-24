"use client";

import { Check, Ellipsis, Pencil, Trash2, Users, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { DocIcon } from "@/components/DocIcon";
import { RelativeTime } from "@/components/RelativeTime";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IconButton } from "@/components/ui/IconButton";
import { Menu, MenuItem } from "@/components/ui/Menu";
import type { ActionState } from "@/lib/action-state";
import { deleteDocument, renameDocument } from "@/lib/document-actions";

type Props = { id: string; title: string; updatedAt: string; sharedCount: number };

// A document the current user owns: open it, rename it inline, delete it (with confirmation).
export function DocumentRow({ id, title, updatedAt, sharedCount }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();

  const [renameState, renameAction, renaming] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await renameDocument(prev, fd);
    if (result.ok) {
      setEditing(false);
      toast.success("Document renamed");
    }
    return result;
  }, {});

  function confirmDelete() {
    startDelete(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const result = await deleteDocument({}, fd);
      setConfirming(false);
      if (result.ok) toast.success(`Deleted "${title}"`);
      else toast.error(result.error ?? "Couldn't delete the document.");
    });
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-zinc-50">
      {editing ? (
        <form action={renameAction} className="flex min-w-0 flex-1 items-start gap-3">
          <DocIcon />
          <input type="hidden" name="id" value={id} />
          <div className="min-w-0 flex-1">
            <input
              name="title"
              defaultValue={title}
              maxLength={200}
              autoFocus
              aria-label="Document title"
              aria-invalid={!!renameState.error}
              onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
              className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium shadow-sm focus:border-accent"
            />
            {renameState.error && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {renameState.error}
              </p>
            )}
          </div>
          <IconButton label="Save title" icon={<Check size={17} aria-hidden />} type="submit" disabled={renaming} className="mt-1" />
          <IconButton label="Cancel rename" icon={<X size={17} aria-hidden />} onClick={() => setEditing(false)} className="mt-1" />
        </form>
      ) : (
        <>
          <Link href={`/docs/${id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg">
            <DocIcon />
            <span className="min-w-0">
              <span className="block truncate font-medium text-zinc-900">{title}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-600">
                <RelativeTime date={updatedAt} prefix="Edited " />
                {sharedCount > 0 && (
                  <Badge icon={<Users size={12} aria-hidden />}>
                    Shared with {sharedCount} {sharedCount === 1 ? "person" : "people"}
                  </Badge>
                )}
              </span>
            </span>
          </Link>
          <Menu
            label={`Actions for ${title}`}
            trigger={<Ellipsis size={18} aria-hidden />}
            triggerClassName="inline-flex size-8 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900"
          >
            <MenuItem icon={<Pencil size={16} aria-hidden />} onClick={() => setEditing(true)}>
              Rename
            </MenuItem>
            <MenuItem danger icon={<Trash2 size={16} aria-hidden />} onClick={() => setConfirming(true)}>
              Delete
            </MenuItem>
          </Menu>
        </>
      )}

      <ConfirmDialog
        open={confirming}
        title="Delete this document?"
        description={
          <>
            &ldquo;{title}&rdquo; will be deleted for you and for everyone it&apos;s shared with. This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete"
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </li>
  );
}
