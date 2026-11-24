"use client";

import { Placeholder } from "@tiptap/extensions";
import { type Editor as TiptapEditor, EditorContent, type JSONContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SaveStatus, type SaveState } from "@/components/SaveStatus";
import { Toolbar } from "@/components/Toolbar";
import { editorExtensions } from "@/lib/editor-extensions";

const AUTOSAVE_DELAY_MS = 1500;

/**
 * Autosave: every edit bumps `version` and (re)starts a 1.5s timer. A save sends the
 * latest content and loops until the server has the newest version.
 * Only one request is in flight at a time so older content can't overwrite newer content.
 * Last write wins: there is no conflict detection between people editing the same doc.
 *
 * `readOnly` (viewers): the editor isn't editable, there is no toolbar and nothing is ever saved.
 * The server enforces this too: the autosave endpoint rejects viewers with 403.
 */
export function Editor({ docId, initialContent, readOnly = false }: { docId: string; initialContent: JSONContent; readOnly?: boolean }) {
  const [state, setState] = useState<SaveState>("saved");
  const [errorMessage, setErrorMessage] = useState("");

  const editorRef = useRef<TiptapEditor | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const version = useRef(0); // bumped on every edit
  const savedVersion = useRef(0); // last version the server confirmed
  const inFlight = useRef(false);

  const save = useCallback(async () => {
    if (inFlight.current) return; // the running save loops again if more edits arrive
    inFlight.current = true;
    try {
      // Keep going until the server has the latest version (edits can land mid-request).
      while (editorRef.current && savedVersion.current !== version.current) {
        const sending = version.current;
        setState("saving");
        const res = await fetch(`/api/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editorRef.current.getJSON() }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? `Save failed (${res.status}).`);
        }
        savedVersion.current = sending;
      }
      setErrorMessage("");
      setState("saved");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Couldn't reach the server.");
      setState("error");
    } finally {
      inFlight.current = false;
    }
  }, [docId]);

  const scheduleSave = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = undefined;
      void save();
    }, AUTOSAVE_DELAY_MS);
  }, [save]);

  const editor = useEditor({
    // Placeholder is editor-only (it doesn't change the document schema), so it is not part of
    // the shared list the importer uses. Keep the default `showOnlyCurrent`: with `false` the
    // extension reads `editor.isEmpty` one transaction late, so the placeholder wouldn't come
    // back right after the last character is deleted.
    extensions: [...editorExtensions, Placeholder.configure({ placeholder: "Start writing…" })],
    content: initialContent,
    editable: !readOnly,
    immediatelyRender: false, // avoids an SSR hydration mismatch
    editorProps: { attributes: { class: "doc-content", "aria-label": "Document content" } },
    onCreate: ({ editor }) => {
      editorRef.current = editor;
    },
    onUpdate: () => {
      if (readOnly) return;
      version.current += 1;
      setState("unsaved");
      scheduleSave();
    },
  });

  // Warn before closing/reloading the tab while there is anything not yet saved.
  useEffect(() => {
    if (state === "saved") return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state]);

  // Leaving via in-app navigation: send pending edits instead of dropping them.
  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
      timer.current = undefined;
      if (version.current !== savedVersion.current) void save();
    };
  }, [save]);

  if (!editor) return <div className="h-64 rounded border border-gray-200 bg-white" />;

  return (
    <div>
      <div className="mb-2 flex justify-end">
        {readOnly ? (
          <span className="rounded-full bg-gray-200 px-3 py-0.5 text-sm font-medium text-gray-700">View only</span>
        ) : (
          <SaveStatus state={state} errorMessage={errorMessage} onRetry={() => void save()} />
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {!readOnly && <Toolbar editor={editor} />}
        {/* Clicking the empty space around the text (not the text itself) focuses the end. */}
        <div
          className={readOnly ? "" : "cursor-text"}
          onClick={(e) => {
            if (!readOnly && e.target === e.currentTarget) editor.commands.focus("end");
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
