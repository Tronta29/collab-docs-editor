"use client";

import { useActionState, useRef, useState } from "react";
import type { ActionState } from "@/lib/action-state";
import type { Collaborator } from "@/lib/documents";
import { ROLE_LABEL } from "@/lib/sharing";
import { shareDocument, unshareDocument, updateShareRole } from "@/lib/sharing-actions";

// Seeded demo accounts, shown as a hint so reviewers know who they can share with.
const DEMO_EMAILS = ["alice@demo.com", "bob@demo.com", "carol@demo.com"];

const selectClass = "rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900";

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
        className={`${selectClass} disabled:opacity-60`}
      >
        <RoleOptions />
      </select>
      {state.error && <span className="mt-1 text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

function RemoveButton({ documentId, person }: { documentId: string; person: Collaborator }) {
  const [state, action, pending] = useActionState(unshareDocument, {});
  return (
    <form action={action} className="flex flex-col items-end">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="userId" value={person.id} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Remove ${person.name}`}
        className="px-1 py-1.5 text-sm text-red-600 hover:underline disabled:opacity-60"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

// Owner-only (the editor page doesn't render it for anyone else).
export function ShareDialog({ documentId, ownerName, collaborators }: { documentId: string; ownerName: string; collaborators: Collaborator[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await shareDocument(prev, fd);
    if (result.ok) formRef.current?.reset();
    return result;
  }, {});

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Share
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Share document"
          className="absolute right-0 z-10 mt-2 w-[28rem] max-w-[90vw] rounded-lg border border-gray-200 bg-white p-4 text-gray-900 shadow-lg"
        >
          <form ref={formRef} action={action} className="flex gap-2">
            <input type="hidden" name="documentId" value={documentId} />
            <input
              name="email"
              type="email"
              autoComplete="off"
              placeholder="Email address"
              aria-label="Email to share with"
              className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
            />
            <select name="role" defaultValue="EDITOR" aria-label="Role for the new person" className={selectClass}>
              <RoleOptions />
            </select>
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? "Sharing…" : "Share"}
            </button>
          </form>
          {state.error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {state.error}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-600">
            Editors can change the content; viewers can only read. Demo accounts: {DEMO_EMAILS.join(", ")}
          </p>

          <h2 className="mt-4 text-sm font-semibold">People with access</h2>
          <ul className="mt-2 divide-y divide-gray-100 text-sm">
            <li className="flex items-center justify-between py-2">
              <span>{ownerName}</span>
              <span className="px-2 text-gray-600">Owner</span>
            </li>
            {collaborators.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-2 py-2">
                <span className="min-w-0 truncate pt-1.5">
                  {c.name} <span className="text-gray-500">{c.email}</span>
                </span>
                <div className="flex items-start gap-1">
                  <RoleSelect documentId={documentId} person={c} />
                  <RemoveButton documentId={documentId} person={c} />
                </div>
              </li>
            ))}
            {collaborators.length === 0 && <li className="py-2 text-gray-500">Not shared with anyone yet.</li>}
          </ul>
          <button type="button" onClick={() => setOpen(false)} className="mt-3 text-sm text-gray-600 hover:underline">
            Close
          </button>
        </div>
      )}
    </div>
  );
}
