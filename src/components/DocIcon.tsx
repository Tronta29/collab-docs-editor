import { FileText } from "lucide-react";

export function DocIcon() {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink">
      <FileText size={20} aria-hidden />
    </span>
  );
}
