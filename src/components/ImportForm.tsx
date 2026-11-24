"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
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

  async function upload(file: File) {
    const problem = precheck(file);
    if (problem) return void toast.error(problem);

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/documents/import", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `Import failed (${res.status}).`);
      toast.success(`Imported "${file.name}"`);
      router.push(`/docs/${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't reach the server.");
      setBusy(false);
    }
  }

  return (
    <>
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
      <Button variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
        <Upload size={16} aria-hidden />
        {busy ? "Importing…" : "Import file"}
      </Button>
    </>
  );
}
