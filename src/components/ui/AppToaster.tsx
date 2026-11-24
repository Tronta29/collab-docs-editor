"use client";

import { Toaster } from "sonner";

// Small, quiet toasts that match the rest of the UI. Validation errors stay inline under their
// inputs; toasts are for outcomes (shared, removed, imported, exported) and unexpected failures.
export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border !border-zinc-200 !bg-white !text-sm !text-zinc-900 !shadow-lg print:!hidden",
          description: "!text-zinc-600",
          closeButton: "!border-zinc-200 !bg-white !text-zinc-600",
        },
      }}
    />
  );
}
