import { generateJSON } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/react";
import mammoth from "mammoth";
import { Marked } from "marked";
import { editorExtensions } from "@/lib/editor-extensions";
import { MAX_IMPORT_BYTES, SUPPORTED_EXTENSIONS } from "@/lib/import/limits";
import { DEFAULT_TITLE, MAX_CONTENT_BYTES } from "@/lib/schemas";

// Pure conversion: (file name, bytes) -> title + Tiptap JSON. No DB, no HTTP, easy to test.

export { MAX_IMPORT_BYTES, SUPPORTED_EXTENSIONS };

export type ImportErrorCode = "unsupported" | "too_large" | "empty" | "corrupt";

export class ImportError extends Error {
  constructor(
    readonly code: ImportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ImportError";
  }
}

export type ImportedDocument = { title: string; content: JSONContent };

// Raw HTML inside Markdown is dropped entirely, so <script>, onerror=… etc. never get through.
// <script>/<style> blocks are removed with their contents so their code doesn't linger as text.
const markdown = new Marked({ renderer: { html: () => "" } });
const stripCodeBlocks = (md: string) => md.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Blank lines separate paragraphs; single newlines inside one become line breaks.
function textToHtml(text: string): string {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\r?\n/g, "<br>")}</p>`)
    .join("");
}

function decodeText(bytes: Uint8Array): string {
  if (bytes.includes(0)) throw new ImportError("corrupt", "This doesn't look like a text file (it contains binary data).");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, "");
  } catch {
    throw new ImportError("corrupt", "This file isn't valid UTF-8 text. Save it as UTF-8 and try again.");
  }
}

const startsWith = (bytes: Uint8Array, ...signature: number[]) => signature.every((b, i) => bytes[i] === b);
const isZip = (bytes: Uint8Array) => startsWith(bytes, 0x50, 0x4b, 0x03, 0x04); // "PK\x03\x04"
const isPdf = (bytes: Uint8Array) => startsWith(bytes, 0x25, 0x50, 0x44, 0x46); // "%PDF"

async function docxToHtml(bytes: Uint8Array): Promise<string> {
  if (!isZip(bytes)) {
    throw new ImportError("corrupt", "This .docx file is corrupt or isn't a real Word document.");
  }
  try {
    const result = await mammoth.convertToHtml(
      { buffer: Buffer.from(bytes) },
      {
        // mammoth ignores underline unless asked to keep it.
        styleMap: ["u => u"],
        // Images aren't supported by the editor; skip reading them.
        convertImage: mammoth.images.imgElement(async () => ({ src: "" })),
      },
    );
    return result.value;
  } catch {
    throw new ImportError("corrupt", "This .docx file is corrupt or isn't a real Word document.");
  }
}

const SAFE_LINK = /^(https?:|mailto:)/i;

// The editor schema already drops unknown tags and attributes (script, onclick, style…).
// The one thing it lets through is a link's href, so only allow harmless protocols.
function sanitize(node: JSONContent): JSONContent {
  const marks = node.marks?.filter((m) => m.type !== "link" || SAFE_LINK.test(String(m.attrs?.href ?? "").trim()));
  const clean: JSONContent = { ...node };
  if (marks) clean.marks = marks;
  if (marks && marks.length === 0) delete clean.marks;
  if (node.content) clean.content = node.content.map(sanitize);
  return clean;
}

const hasText = (node: JSONContent): boolean =>
  (node.type === "text" && !!node.text?.trim()) || !!node.content?.some(hasText);

function titleFromFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? "";
  const title = base.replace(/\.[^.]+$/, "").trim().slice(0, 200);
  return title || DEFAULT_TITLE;
}

export async function convertFile(fileName: string, bytes: Uint8Array): Promise<ImportedDocument> {
  const ext = /\.[^.]+$/.exec(fileName.toLowerCase())?.[0] ?? "";
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new ImportError("unsupported", `Unsupported file type${ext ? ` "${ext}"` : ""}. Use ${SUPPORTED_EXTENSIONS.join(", ")}.`);
  }
  if (bytes.length === 0) throw new ImportError("empty", "The file is empty.");
  if (bytes.length > MAX_IMPORT_BYTES) {
    throw new ImportError("too_large", `The file is too large. The limit is ${MAX_IMPORT_BYTES / 1024 / 1024} MB.`);
  }

  let html: string;
  if (ext === ".docx") {
    html = await docxToHtml(bytes);
  } else {
    // A renamed PDF/Word file must not be read as text.
    if (isZip(bytes) || isPdf(bytes)) {
      throw new ImportError("corrupt", `This file's content doesn't match its "${ext}" extension.`);
    }
    const text = decodeText(bytes);
    html = ext === ".md" ? await markdown.parse(stripCodeBlocks(text)) : textToHtml(text);
  }

  const content = sanitize(generateJSON(html, editorExtensions));
  if (!hasText(content)) throw new ImportError("empty", "The file has no text to import.");
  if (Buffer.byteLength(JSON.stringify(content)) > MAX_CONTENT_BYTES) {
    throw new ImportError("too_large", "The file is too long to edit once imported (limit is about 1 MB of content).");
  }

  return { title: titleFromFileName(fileName), content };
}
