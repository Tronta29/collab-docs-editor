import type { JSONContent } from "@tiptap/react";
import { describe, expect, it } from "vitest";
import { attachmentHeader, safeFileName } from "@/lib/export/filename";
import { tiptapToMarkdown } from "@/lib/export/markdown";
import { convertFile } from "@/lib/import/convert";

// Small builders so each test reads like the document it describes.
const text = (t: string, ...marks: string[]): JSONContent => ({
  type: "text",
  text: t,
  ...(marks.length && { marks: marks.map((type) => ({ type })) }),
});
const p = (...content: JSONContent[]): JSONContent => ({ type: "paragraph", content });
const h = (level: number, t: string): JSONContent => ({ type: "heading", attrs: { level }, content: [text(t)] });
const li = (...content: JSONContent[]): JSONContent => ({ type: "listItem", content });
const ul = (...items: JSONContent[]): JSONContent => ({ type: "bulletList", content: items });
const ol = (...items: JSONContent[]): JSONContent => ({ type: "orderedList", content: items });
const doc = (...content: JSONContent[]): JSONContent => ({ type: "doc", content });

describe("tiptapToMarkdown", () => {
  it("converts H1, H2 and H3 to # headings", () => {
    expect(tiptapToMarkdown(doc(h(1, "One"), h(2, "Two"), h(3, "Three")))).toBe("# One\n\n## Two\n\n### Three\n");
  });

  it("converts bold and italic, and keeps paragraphs separate", () => {
    const md = tiptapToMarkdown(doc(p(text("plain "), text("bold", "bold"), text(" and "), text("italic", "italic")), p(text("Second."))));
    expect(md).toBe("plain **bold** and *italic*\n\nSecond.\n");
  });

  it("converts bold + italic on the same text", () => {
    expect(tiptapToMarkdown(doc(p(text("both", "bold", "italic"))))).toBe("***both***\n");
  });

  it("converts a bulleted list", () => {
    expect(tiptapToMarkdown(doc(ul(li(p(text("one"))), li(p(text("two"))), li(p(text("three"))))))).toBe("- one\n- two\n- three\n");
  });

  it("converts a numbered list", () => {
    expect(tiptapToMarkdown(doc(ol(li(p(text("first"))), li(p(text("second"))))))).toBe("1. first\n2. second\n");
  });

  it("indents a nested list under its parent item", () => {
    const md = tiptapToMarkdown(doc(ul(li(p(text("parent")), ul(li(p(text("child"))))), li(p(text("sibling"))))));
    expect(md).toBe("- parent\n    - child\n- sibling\n");
  });

  it("keeps a list between paragraphs and headings in order", () => {
    const md = tiptapToMarkdown(doc(h(2, "Goals"), ul(li(p(text("a"))), li(p(text("b")))), p(text("After the list."))));
    expect(md).toBe("## Goals\n\n- a\n- b\n\nAfter the list.\n");
  });

  describe("underline", () => {
    // Markdown has no underline syntax. Decision: keep it as inline HTML so the formatting
    // isn't lost silently; GitHub and most Markdown renderers display <u>.
    it("is kept as <u>…</u>", () => {
      expect(tiptapToMarkdown(doc(p(text("an "), text("underlined", "underline"), text(" word"))))).toBe("an <u>underlined</u> word\n");
    });

    it("can combine with bold", () => {
      expect(tiptapToMarkdown(doc(p(text("both", "bold", "underline"))))).toBe("**<u>both</u>**\n");
    });
  });

  it("keeps links and line breaks", () => {
    const link: JSONContent = { type: "text", text: "site", marks: [{ type: "link", attrs: { href: "https://example.com" } }] };
    expect(tiptapToMarkdown(doc(p(text("see "), link)))).toBe("see [site](https://example.com)\n");
    expect(tiptapToMarkdown(doc(p(text("line one"), { type: "hardBreak" }, text("line two"))))).toBe("line one  \nline two\n");
  });

  it("escapes characters that Markdown would otherwise interpret", () => {
    const md = tiptapToMarkdown(doc(p(text("2 * 3 = 6 and snake_case")), p(text("# not a heading")), p(text("1. not a list"))));
    expect(md).not.toMatch(/^# /m);
    expect(md).toContain("\\# not a heading");
    expect(md).toContain("1\\. not a list");
    expect(md).toContain("2 \\* 3");
  });

  it("returns an empty string for an empty document", () => {
    expect(tiptapToMarkdown(doc({ type: "paragraph" }))).toBe("");
    expect(tiptapToMarkdown(doc())).toBe("");
  });

  it("round-trips through the importer (formatting survives, underline is the one loss)", async () => {
    const original = doc(h(1, "Plan"), p(text("Ship "), text("it", "bold")), ul(li(p(text("one"))), li(p(text("two")))), ol(li(p(text("a"))), li(p(text("b")))));
    const md = tiptapToMarkdown(original);
    const { content } = await convertFile("plan.md", new TextEncoder().encode(md));
    expect(tiptapToMarkdown(content)).toBe(md);
  });
});

describe("safeFileName", () => {
  it("adds the extension to a normal title", () => {
    expect(safeFileName("Quarterly review", "md")).toBe("Quarterly review.md");
  });

  it("removes path separators and characters Windows rejects", () => {
    expect(safeFileName('a/b\\c:d*e?f"g<h>i|j', "md")).toBe("a b c d e f g h i j.md");
    expect(safeFileName("../../etc/passwd", "md")).not.toMatch(/[/\\]/);
    expect(safeFileName("../../etc/passwd", "md")).toBe("etc passwd.md");
  });

  it("removes control characters and newlines (no header injection)", () => {
    const name = safeFileName("evil\r\nSet-Cookie: x=1\u0000", "md");
    expect(name).not.toMatch(/[\r\n\u0000]/);
  });

  it("keeps non-ASCII letters", () => {
    expect(safeFileName("1değiştirme çalışma", "md")).toBe("1değiştirme çalışma.md");
  });

  it("falls back for empty or reserved names", () => {
    expect(safeFileName("", "md")).toBe("document.md");
    expect(safeFileName("   ...  ", "md")).toBe("document.md");
    expect(safeFileName('<>:"/\\|?*', "md")).toBe("document.md");
    expect(safeFileName("CON", "md")).toBe("CON_.md");
  });

  it("trims trailing dots and spaces and caps the length", () => {
    expect(safeFileName("notes. . ", "md")).toBe("notes.md");
    const long = safeFileName("x".repeat(500), "md");
    expect(long).toHaveLength(100 + ".md".length);
  });
});

describe("attachmentHeader", () => {
  it("gives an ASCII fallback and an encoded UTF-8 name", () => {
    const header = attachmentHeader("1değiştirme.md");
    expect(header).toBe(`attachment; filename="1de_i_tirme.md"; filename*=UTF-8''1de%C4%9Fi%C5%9Ftirme.md`);
  });

  it("never lets quotes or backslashes through", () => {
    expect(attachmentHeader('a"b\\c.md')).toContain('filename="a_b_c.md"');
  });
});
