import { describe, expect, it } from "vitest";
import { initialsOf } from "@/lib/initials";
import { formatRelativeTime } from "@/lib/time";

const now = new Date("2026-11-25T12:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms);
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it("says 'just now' for the first minute, and for dates slightly in the future", () => {
    expect(formatRelativeTime(ago(0), now)).toBe("just now");
    expect(formatRelativeTime(ago(59_000), now)).toBe("just now");
    expect(formatRelativeTime(new Date(now.getTime() + 5000), now)).toBe("just now");
  });

  it("uses minutes up to an hour", () => {
    expect(formatRelativeTime(ago(MIN), now)).toBe("1 min ago");
    expect(formatRelativeTime(ago(5 * MIN + 20_000), now)).toBe("5 min ago");
    expect(formatRelativeTime(ago(59 * MIN), now)).toBe("59 min ago");
  });

  it("uses hours up to a day, and days up to a week", () => {
    expect(formatRelativeTime(ago(HOUR), now)).toBe("1 h ago");
    expect(formatRelativeTime(ago(23 * HOUR), now)).toBe("23 h ago");
    expect(formatRelativeTime(ago(DAY), now)).toBe("1 d ago");
    expect(formatRelativeTime(ago(6 * DAY), now)).toBe("6 d ago");
  });

  it("falls back to a plain date after a week", () => {
    expect(formatRelativeTime(new Date("2026-11-10T09:00:00Z"), now)).toBe("Nov 10, 2026");
  });

  it("accepts ISO strings and survives invalid input", () => {
    expect(formatRelativeTime("2026-11-25T11:55:00Z", now)).toBe("5 min ago");
    expect(formatRelativeTime("not a date", now)).toBe("just now");
  });
});

describe("initialsOf", () => {
  it.each([
    ["Alice", "A"],
    ["bob", "B"],
    ["Bob Smith", "BS"],
    ["  ada   king lovelace ", "AL"],
    ["Çağlar", "Ç"],
    ["İpek Yıldız", "İY"],
    ["", "?"],
    ["   ", "?"],
  ])("%j -> %s", (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});
