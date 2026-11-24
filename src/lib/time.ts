const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const absolute = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** "just now", "5 min ago", "3 h ago", "2 d ago", then a plain date after a week. */
export function formatRelativeTime(date: Date | string, now: Date = new Date()): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const diff = now.getTime() - then.getTime();
  if (Number.isNaN(diff) || diff < MINUTE) return "just now"; // also covers small clock differences (future dates)
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} d ago`;
  return absolute(then);
}

export const formatFullDate = (date: Date | string) =>
  new Date(date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
