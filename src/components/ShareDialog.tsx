"use client";

import { Share2, X } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { usePopover } from "@/components/ui/usePopover";
import type { ActionState } from "@/lib/action-state";
import type { Collaborator } from "@/lib/documents";
import { ROLE_LABEL } from "@/lib/sharing";
import { shareDocument, unshareDocument, updateShareRole } from "@/lib/sharing-actions";

// Seeded demo accounts, shown as a hint so reviewers know who they can share with.
const DEMO_EMAILS = ["alice@demo.com", "bob@demo.com", "carol@demo.com"];

const selectClass = "h-8 rounded-lg border border-zinc-300 bg-white px-2 text-sm text-zinc-900 shadow-sm disabled:opacity-60";

function RoleOptions() {
  return (
    <>
      <option value="EDITOR">{ROLE_LABEL.EDITOR}</option>
      <option value="VIEWER">{ROLE_LABEL.VIEWER}</option>
    </>
  );
}

// Changing the dropdown saves immediately. If the server refuses, the dropdown snaps back.
function RoleSelect({ documentId, person }: { documentId: string; person: Collaborator }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await updateShareRole(prev, fd);
    if (result.error) formRef.current?.reset();
    else toast.success(`${person.name} is now ${fd.get("role") === "VIEWER" ? "a Viewer" : "an Editor"}`);
    return result;
  }, {});

  return (
    <form ref={formRef} action={action} className="flex flex-col items-end">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="userId" value={person.id} />
      <select
        name="role"
        key={person.role} // re-sync with the saved role after the page refreshes
        defaultValue={person.role}
        disabled={pending}
        aria-label={`Role for ${person.name}`}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={selectClass}
      >
        <RoleOptions />
      </select>
      {state.error && <span className="mt-1 max-w-40 text-right text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

function RemoveButton({ documentId, person }: { documentId: string; person: Collaborator }) {
  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await unshareDocument(prev, fd);
    if (result.ok) toast.success(`Removed ${person.name}'s access`);
    else if (result.error) toast.error(result.error);
    return result;
  }, {});
  return (
    <form action={action} aria-busy={pending}>
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="userId" value={person.id} />
      <IconButton type="submit" danger label={`Remove ${person.name}`} icon={<X size={16} aria-hidden />} disabled={pending} />
      {state.error && <span className="sr-only">{state.error}</span>}
    </form>
  );
}

// Owner-only (the editor page doesn't render it for anyone else).
export function ShareDialog({ documentId, ownerName, collaborators }: { documentId: string; ownerName: string; collaborators: Collaborator[] }) {
  const { open, setOpen, rootRef } = usePopover();
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await shareDocument(prev, fd);
    if (result.ok) {
      formRef.current?.reset();
      toast.success(`Shared with ${String(fd.get("email")).trim().toLowerCase()} as ${fd.get("role") === "VIEWER" ? "a Viewer" : "an Editor"}`);
    }
    return result;
  }, {});

  useEffect(() => {
    if (open) emailRef.current?.focus();
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0 print:hidden">
      <Button variant="primary" data-popover-trigger aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(!open)}>
        <Share2 size={16} aria-hidden />
        Share
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Share document"
          className="absolute right-0 z-30 mt-2 w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-xl"
        >
          <h2 className="text-sm font-semibold">Share this document</h2>
          <form ref={formRef} action={action} className="mt-3 flex gap-2">
            <input type="hidden" name="documentId" value={documentId} />
            <input
              ref={emailRef}
              name="email"
              type="email"
              autoComplete="off"
              placeholder="Email address"
              aria-label="Email to share with"
              aria-invalid={!!state.error}
              className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm shadow-sm placeholder:text-zinc-500 focus:border-accent"
            />
            <select name="role" defaultValue="EDITOR" aria-label="Role for the new person" className={`${selectClass} h-9`}>
              <RoleOptions />
            </select>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Sharing…" : "Share"}
            </Button>
          </form>
          {state.error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {state.error}
            </p>
          )}
          <p className="mt-2 text-xs text-zinc-600">
            Editors can change the content; viewers can only read. Demo accounts: {DEMO_EMAILS.join(", ")}
          </p>

          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-600">People with access</h3>
          <ul className="mt-1 divide-y divide-zinc-100 text-sm">
            <li className="flex items-center gap-3 py-2.5">
              <Avatar name={ownerName} />
              <span className="min-w-0 flex-1 truncate font-medium">{ownerName}</span>
              <span className="px-2 text-zinc-600">Owner</span>
            </li>
            {collaborators.map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-2.5">
                <Avatar name={c.name} />
                <span className="min-w-0 flex-1 pt-0.5">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block truncate text-xs text-zinc-600">{c.email}</span>
                </span>
                <div className="flex items-start gap-1">
                  <RoleSelect documentId={documentId} person={c} />
                  <RemoveButton documentId={documentId} person={c} />
                </div>
              </li>
            ))}
            {collaborators.length === 0 && <li className="py-3 text-zinc-600">Not shared with anyone yet.</li>}
          </ul>
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
