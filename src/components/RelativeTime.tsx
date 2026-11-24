"use client";

import { formatFullDate, formatRelativeTime } from "@/lib/time";

// Rendered in the browser's own clock and time zone. The server and the browser can disagree by a
// minute (or a time zone), so the text mismatch during hydration is expected and harmless.
export function RelativeTime({ date, prefix = "" }: { date: string; prefix?: string }) {
  return (
    <time dateTime={date} title={formatFullDate(date)} suppressHydrationWarning>
      {prefix}
      {formatRelativeTime(date)}
    </time>
  );
}
