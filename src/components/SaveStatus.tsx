export type SaveState = "saved" | "unsaved" | "saving" | "error";

type Props = { state: SaveState; errorMessage: string; onRetry: () => void };

export function SaveStatus({ state, errorMessage, onRetry }: Props) {
  return (
    <p role="status" aria-live="polite" className="text-sm">
      {state === "saved" && <span className="text-green-700">Saved</span>}
      {state === "saving" && <span className="text-gray-500">Saving…</span>}
      {state === "unsaved" && <span className="text-gray-500">Unsaved changes</span>}
      {state === "error" && (
        <span className="text-red-600">
          Error{errorMessage && `: ${errorMessage}`} —{" "}
          <button type="button" onClick={onRetry} className="underline">
            retry
          </button>
        </span>
      )}
    </p>
  );
}
