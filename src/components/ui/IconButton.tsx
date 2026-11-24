import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title" | "aria-label"> & {
  /** Required: shown as the tooltip and used as the accessible name. */
  label: string;
  icon: ReactNode;
  active?: boolean;
  danger?: boolean;
};

// A real <button> with an icon only. Always has a tooltip (title) and an aria-label.
export function IconButton({ label, icon, active, danger, className = "", type = "button", ...rest }: Props) {
  const tone = active
    ? "bg-accent-soft text-accent-ink"
    : danger
      ? "text-zinc-600 hover:bg-red-50 hover:text-red-700"
      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950";
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex size-8 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent ${tone} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  );
}
