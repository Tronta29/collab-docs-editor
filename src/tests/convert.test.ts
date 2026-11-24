import { readFileSync } from "node:fs";
import path from "node:path";
import type { JSONContent } from "@tiptap/react";
import { describe, expect, it } from "vitest";
import { convertFile, ImportError, MAX_IMPORT_BYTES } from "@/lib/import/convert";

const bytes = (s: string) => new TextEncoder().encode(s);
const sample = (name: string) => new Uint8Array(readFileSync(path.join(import.meta.dirname, "../../samples", name)));

// Helpers to read the converted tree without depending on its exact shape.
const walk = (n: JSONContent, out: JSONContent[] = []): JSONContent[] => {
  out.push(n);
  n.content?.forEach((c) => walk(c, out));
  return out;
};
const nodes = (doc: JSONContent, type: string) => walk(doc).filter((n) => n.type === type);
const textOf = (n: JSONContent) => nodes(n, "text").map((t) => t.text).join("");
const markTypes = (doc: JSONContent) => nodes(doc, "text").flatMap((t) => t.marks?.map((m) => m.type) ?? []);
const rejects = (p: Promise<unknown>, code: string) =>
  expect(p).rejects.toMatchObject({ name: "ImportError", code });

describe("convertFile: .txt", () => {
  it("turns blank-line separated blocks into paragraphs and keeps single newlines as line breaks", async () => {
    const { title, content } = await convertFile("notes.txt", bytes("First para\nsame para\r\n\r\nSecond para"));
    expect(title).toBe("notes");
    expect(nodes(content, "paragraph")).toHaveLength(2);
    expect(nodes(content, "hardBreak")).toHaveLength(1);
    expect(textOf(content)).toBe("First parasame paraSecond para");
  });

  it("treats HTML as literal text, not markup", async () => {
    const { content } = await convertFile("x.txt", bytes('<script>alert(1)</script> <b>hi</b> & "q"'));
    expect(textOf(content)).toBe('<script>alert(1)</script> <b>hi</b> & "q"');
    expect(markTypes(content)).toEqual([]);
  });

  it("strips a UTF-8 BOM", async () => {
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...bytes("hello")]);
    expect(textOf((await convertFile("a.txt", withBom)).content)).toBe("hello");
  });
});

describe("convertFile: .md", () => {
  it("converts a heading, a bulleted list and bold text", async () => {
    const { title, content } = await convertFile("plan.md", bytes("# Plan\n\n- one\n- **two**\n\n1. a\n2. b"));
    expect(title).toBe("plan");
    expect(nodes(content, "heading")[0].attrs?.level).toBe(1);
    expect(nodes(content, "bulletList")).toHaveLength(1);
    expect(nodes(content, "orderedList")).toHaveLength(1);
    expect(nodes(content, "listItem")).toHaveLength(4);
    expect(markTypes(content)).toContain("bold");
  });

  it("drops raw HTML (scripts, event handlers) but keeps the surrounding text", async () => {
    const md = 'Hello <script>alert(1)</script> world\n\n<img src=x onerror="alert(1)">\n\n<div onclick="x()">block</div>';
    const { content } = await convertFile("evil.md", bytes(md));
    const json = JSON.stringify(content);
    expect(json).not.toMatch(/script|alert|onerror|onclick/i);
    expect(textOf(content)).toContain("Hello");
    expect(textOf(content)).toContain("world");
  });

  it("keeps https links but removes javascript: links", async () => {
    const { content } = await convertFile("l.md", bytes("[ok](https://example.com) and [bad](javascript:alert(1))"));
    const hrefs = nodes(content, "text").flatMap((t) => t.marks ?? []).filter((m) => m.type === "link").map((m) => m.attrs?.href);
    expect(hrefs).toEqual(["https://example.com"]);
    expect(textOf(content)).toContain("bad"); // the text stays, only the link goes
  });
});

describe("convertFile: .docx", () => {
  it("converts headings, formatting and lists from a real .docx fixture", async () => {
    const { title, content } = await convertFile("Quarterly.Review.DOCX", sample("sample.docx"));
    expect(title).toBe("Quarterly.Review");
    expect(nodes(content, "heading").map((h) => [h.attrs?.level, textOf(h)])).toEqual([
      [1, "Quarterly Review"],
      [2, "Highlights"],
      [2, "Next steps"],
    ]);
    expect(markTypes(content)).toEqual(expect.arrayContaining(["bold", "italic", "underline"]));
    expect(nodes(content, "bulletList")).toHaveLength(1);
    expect(nodes(content, "orderedList")).toHaveLength(1);
    expect(nodes(content, "listItem").map(textOf)).toEqual([
      "Revenue grew 12%",
      "Two new customers signed",
      "Hire a designer",
      "Ship the editor",
    ]);
  });

  it("rejects a file named .docx that isn't a zip at all", async () => {
    await rejects(convertFile("fake.docx", bytes("this is just text")), "corrupt");
  });

  it("rejects a corrupt .docx (valid zip signature, broken contents)", async () => {
    const truncated = sample("sample.docx").slice(0, 400);
    await rejects(convertFile("broken.docx", truncated), "corrupt");
  });

  it("rejects a zip that is not a Word document", async () => {
    const notWord = new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...new Array(60).fill(1)]);
    await rejects(convertFile("zip.docx", notWord), "corrupt");
  });
});

describe("convertFile: validation", () => {
  it.each(["report.pdf", "image.png", "archive.zip", "noextension", "old.doc"])("rejects unsupported type %s", async (name) => {
    await rejects(convertFile(name, bytes("hello")), "unsupported");
  });

  it("names the supported types in the error message", async () => {
    await expect(convertFile("a.pdf", bytes("x"))).rejects.toThrow(/\.txt, \.md, \.docx/);
  });

  it("rejects empty files, and files with only whitespace", async () => {
    await rejects(convertFile("e.txt", new Uint8Array()), "empty");
    await rejects(convertFile("w.md", bytes("  \n\n \t ")), "empty");
  });

  it("rejects files over 2 MB", async () => {
    await rejects(convertFile("big.txt", new Uint8Array(MAX_IMPORT_BYTES + 1).fill(97)), "too_large");
  });

  it("rejects a file within 2 MB when the converted document exceeds the ~1 MB content cap", async () => {
    // Autosave refuses content over 1 MB, so importing something that could never be saved would be a trap.
    await rejects(convertFile("limit.txt", new Uint8Array(MAX_IMPORT_BYTES).fill(97)), "too_large");
  });

  it("rejects binary data and non-UTF-8 text posing as .txt/.md", async () => {
    await rejects(convertFile("bin.txt", new Uint8Array([104, 105, 0, 1, 2])), "corrupt");
    await rejects(convertFile("latin1.md", new Uint8Array([0xff, 0xfe, 0xfd, 0x80])), "corrupt");
  });

  it("rejects a PDF or Word file renamed to .txt", async () => {
    await rejects(convertFile("sneaky.txt", bytes("%PDF-1.7 fake")), "corrupt");
    await rejects(convertFile("sneaky.md", sample("sample.docx")), "corrupt");
  });

  it("uses a fallback title when the file name has no base name", async () => {
    expect((await convertFile(".txt", bytes("hello"))).title).toBe("Untitled document");
  });

  it("throws ImportError instances", async () => {
    await expect(convertFile("a.pdf", bytes("x"))).rejects.toBeInstanceOf(ImportError);
  });
});
