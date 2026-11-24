import { describe, expect, it } from "vitest";
import { MAX_TITLE_LENGTH, nextAvailableTitle } from "@/lib/titles";

describe("nextAvailableTitle", () => {
  it("keeps the title when there is no conflict", () => {
    expect(nextAvailableTitle("sample", [])).toBe("sample");
    expect(nextAvailableTitle("sample", ["other", "sample 2", "my sample"])).toBe("sample");
  });

  it("appends (2) on the first conflict", () => {
    expect(nextAvailableTitle("sample", ["sample"])).toBe("sample (2)");
  });

  it("keeps counting: (3), (4)…", () => {
    expect(nextAvailableTitle("sample", ["sample", "sample (2)"])).toBe("sample (3)");
    expect(nextAvailableTitle("sample", ["sample", "sample (2)", "sample (3)"])).toBe("sample (4)");
  });

  it("reuses the lowest free number instead of counting documents", () => {
    // "sample (2)" was deleted: 3 titles exist, but (2) is the first free slot.
    expect(nextAvailableTitle("sample", ["sample", "sample (3)", "sample (4)"])).toBe("sample (2)");
  });

  it("compares case-insensitively and ignores surrounding spaces", () => {
    expect(nextAvailableTitle("Sample", ["sample"])).toBe("Sample (2)");
    expect(nextAvailableTitle("sample", ["SAMPLE", "Sample (2)"])).toBe("sample (3)");
    expect(nextAvailableTitle("  sample  ", [" sample "])).toBe("sample (2)");
  });

  it("numbers from the root when the title already ends in (N)", () => {
    expect(nextAvailableTitle("sample (2)", ["sample", "sample (2)"])).toBe("sample (3)");
    expect(nextAvailableTitle("sample (2)", ["sample (2)"])).toBe("sample (3)");
    expect(nextAvailableTitle("report (5)", ["report (5)", "report (2)", "report (3)"])).toBe("report (4)");
  });

  it("leaves a title ending in (N) alone when it doesn't conflict", () => {
    expect(nextAvailableTitle("sample (2)", ["sample"])).toBe("sample (2)");
  });

  it("applies the same rule to the default title", () => {
    expect(nextAvailableTitle("Untitled document", ["Untitled document"])).toBe("Untitled document (2)");
    expect(nextAvailableTitle("Untitled document", ["Untitled document", "Untitled document (2)"])).toBe(
      "Untitled document (3)",
    );
  });

  it("stays within the title length limit", () => {
    const long = "x".repeat(MAX_TITLE_LENGTH);
    const result = nextAvailableTitle(long, [long]);
    expect(result).toHaveLength(MAX_TITLE_LENGTH);
    expect(result.endsWith(" (2)")).toBe(true);
  });
});
