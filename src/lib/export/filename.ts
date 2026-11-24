const MAX_BASE_LENGTH = 100;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/** A file name that is safe on Windows, macOS and Linux and can't break out of a header. */
export function safeFileName(title: string, extension: string): string {
  let base = title
    .normalize("NFC")
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, " ") // path separators, reserved and control characters
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+/, "") // no hidden files or ".." prefixes
    .replace(/[.\s]+$/, "") // Windows drops trailing dots and spaces
    .slice(0, MAX_BASE_LENGTH)
    .replace(/[.\s]+$/, "");
  if (!base || WINDOWS_RESERVED.test(base)) base = base ? `${base}_` : "document";
  return `${base}.${extension}`;
}

/**
 * Content-Disposition for a download: a plain ASCII `filename` for old clients plus an RFC 5987
 * `filename*` carrying the real (possibly non-ASCII) name.
 */
export function attachmentHeader(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(fileName).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
