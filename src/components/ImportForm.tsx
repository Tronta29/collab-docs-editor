"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { MAX_IMPORT_BYTES, SUPPORTED_EXTENSIONS } from "@/lib/import/limits";

// Quick client-side checks for fast feedback. The server validates everything again.
function precheck(file: File): string | null {
  const ext = /\.[^.]+$/.exec(file.name.toLowerCase())?.[0] ?? "";
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `Unsupported file type${ext ? ` "${ext}"` : ""}. Use ${SUPPORTED_EXTENSIONS.join(", ")}.`;
  }
  if (file.size === 0) return "The file is empty.";
  if (file.size > MAX_IMPORT_BYTES) return `The file is too large. The limit is ${MAX_IMPORT_BYTES / 1024 / 1024} MB.`;
  return null;
}

export function ImportForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    const problem = precheck(file);
    if (problem) return setError(problem);

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/documents/import", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `Import failed (${res.status}).`);
      router.push(`/docs/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reach the server.");
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={SUPPORTED_EXTENSIONS.join(",")}
          className="hidden"
          aria-label="Import file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // allow picking the same file again after an error
            if (file) void upload(file);
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-60"
        >
          {busy ? "Importing…" : "Import file"}
        </button>
        <span className="text-sm text-gray-600">
          Supported: {SUPPORTED_EXTENSIONS.join(", ")} · max {MAX_IMPORT_BYTES / 1024 / 1024} MB · creates a new document
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
