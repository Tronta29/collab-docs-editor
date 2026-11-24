import { initialsOf } from "@/lib/initials";

// A few muted tones so people are easy to tell apart. Same name -> same tone.
const TONES = [
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
];

const toneFor = (name: string) => TONES[Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TONES.length];

const sizes = { sm: "size-7 text-xs", md: "size-8 text-sm", lg: "size-11 text-base" };

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof sizes }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${sizes[size]} ${toneFor(name)}`}
    >
      {initialsOf(name)}
    </span>
  );
}
