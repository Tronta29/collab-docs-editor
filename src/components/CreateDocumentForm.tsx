"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { createDocument } from "@/lib/document-actions";

// One click creates an "Untitled document" (numbered if needed) and opens it; the title is
// edited inline in the editor. On success the action redirects to the editor.
export function CreateDocumentForm() {
  const [state, action, pending] = useActionState(createDocument, {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action}>
      <Button type="submit" variant="primary" disabled={pending}>
        <Plus size={16} aria-hidden />
        {pending ? "Creating…" : "New document"}
      </Button>
    </form>
  );
}
