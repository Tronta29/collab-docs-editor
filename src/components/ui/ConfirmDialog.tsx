"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Modal confirmation on the native <dialog> element: focus trap, Escape and backdrop come built in. */
export function ConfirmDialog({ open, title, description, confirmLabel, pending, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault(); // Escape: let our state decide
        onCancel();
      }}
      onClick={(e) => e.target === ref.current && onCancel()} // click on the backdrop
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-zinc-900/40"
    >
      <div className="p-5">
        <h2 id="confirm-title" className="text-base font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={pending} autoFocus>
            {pending ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
