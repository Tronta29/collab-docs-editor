import type { ReactNode } from "react";

const tones = {
  neutral: "bg-zinc-100 text-zinc-700",
  accent: "bg-accent-soft text-accent-ink",
};

export function Badge({ children, tone = "neutral", icon }: { children: ReactNode; tone?: keyof typeof tones; icon?: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {icon}
      {children}
    </span>
  );
}
