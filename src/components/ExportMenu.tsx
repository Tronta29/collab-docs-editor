"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  docId: string;
  /** Called before a Markdown download so pending edits are saved first. Resolve false to cancel. */
  beforeDownload?: () => Promise<boolean>;
};

const itemClass = "block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100";

export function ExportMenu({ docId, beforeDownload }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function downloadMarkdown() {
    setOpen(false);
    setError("");
    // The export reads what is saved on the server, so save the latest edits first.
    if (beforeDownload && !(await beforeDownload())) {
      setError("Your latest changes couldn't be saved, so nothing was exported. Fix the save error and try again.");
      return;
    }
    const link = document.createElement("a");
    link.href = `/api/documents/${docId}/export?format=md`;
    link.download = ""; // the server names the file ("<title>.md")
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function printPdf() {
    setOpen(false);
    // Print styles (globals.css) hide everything except the title and the content.
    // Let the menu finish closing before the browser takes its snapshot.
    setTimeout(() => window.print(), 50);
  }

  return (
    <div ref={rootRef} className="relative print:hidden">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-800 hover:bg-gray-100"
      >
        Export ▾
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <button type="button" role="menuitem" onClick={() => void downloadMarkdown()} className={itemClass}>
            Markdown (.md)
          </button>
          <button type="button" role="menuitem" onClick={printPdf} className={itemClass}>
            PDF (print)
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="absolute right-0 z-10 mt-1 w-64 rounded border border-red-200 bg-white p-2 text-xs text-red-600 shadow">
          {error}
        </p>
      )}
    </div>
  );
}
