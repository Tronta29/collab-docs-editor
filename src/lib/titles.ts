export const MAX_TITLE_LENGTH = 200;

const NUMBER_SUFFIX = /^(.*\S)\s+\((\d+)\)$/;
const key = (title: string) => title.trim().toLowerCase();

/**
 * Drive-style de-duplication for NEW documents: "sample", "sample (2)", "sample (3)"…
 * Pure: pass in the titles the user already owns. Comparison ignores case and surrounding
 * spaces. Picks the lowest free number, so a deleted "sample (2)" is reused.
 * A base that already ends in " (N)" is numbered from its root: "sample (2)" -> "sample (3)".
 * Renames don't go through this: explicitly choosing an existing title is allowed.
 */
export function nextAvailableTitle(baseTitle: string, existingTitles: readonly string[]): string {
  const taken = new Set(existingTitles.map(key));
  const base = baseTitle.trim();
  if (!taken.has(key(base))) return base;

  const root = NUMBER_SUFFIX.exec(base)?.[1] ?? base;
  for (let n = 2; ; n++) {
    const suffix = ` (${n})`;
    // Keep the whole title within the length limit by trimming the root, not the number.
    const candidate = root.slice(0, MAX_TITLE_LENGTH - suffix.length).trimEnd() + suffix;
    if (!taken.has(key(candidate))) return candidate;
  }
}
