import { Check, CircleAlert, LoaderCircle } from "lucide-react";

export type SaveState = "saved" | "unsaved" | "saving" | "error";

type Props = { state: SaveState; errorMessage: string; onRetry: () => void };

// Deliberately quiet: a small icon and a few words, in the corner of the toolbar bar.
export function SaveStatus({ state, errorMessage, onRetry }: Props) {
  return (
    <p role="status" aria-live="polite" className="flex items-center gap-1.5 whitespace-nowrap text-xs text-zinc-600">
      {state === "saved" && (
        <>
          <Check size={14} aria-hidden className="text-emerald-600" /> Saved
        </>
      )}
      {state === "saving" && (
        <>
          <LoaderCircle size={14} aria-hidden className="animate-spin" /> Saving…
        </>
      )}
      {state === "unsaved" && (
        <>
          <span aria-hidden className="size-1.5 rounded-full bg-amber-500" /> Unsaved changes
        </>
      )}
      {state === "error" && (
        <span className="flex items-center gap-1.5 text-red-700" title={errorMessage || undefined}>
          <CircleAlert size={14} aria-hidden /> Couldn&apos;t save
          <button type="button" onClick={onRetry} className="rounded font-medium underline underline-offset-2">
            Retry
          </button>
        </span>
      )}
    </p>
  );
}
