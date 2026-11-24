import { generateHTML } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/react";
import TurndownService from "turndown";
import { editorExtensions } from "@/lib/editor-extensions";

// Pure export: Tiptap JSON -> HTML (the same extension list as the editor and the importer)
// -> Markdown. No DB, no HTTP.

const turndown = new TurndownService({
  headingStyle: "atx", // "# Title"
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
  codeBlockStyle: "fenced",
});

// Markdown has no underline. We keep it as inline HTML (`<u>…</u>`), which GitHub and most
// renderers display, rather than silently dropping the formatting. (Our own Markdown importer
// strips raw HTML but keeps the text, so re-importing an export loses only the underline.)
turndown.addRule("underline", {
  filter: ["u"],
  replacement: (content) => (content.trim() ? `<u>${content}</u>` : content),
});

// Turndown's default list item is "-   item" (three spaces). Use "- item" / "1. item" instead.
turndown.addRule("listItem", {
  filter: "li",
  replacement(content, node, options) {
    // Tiptap wraps item text in <p>, which turndown renders with blank lines around it.
    const body = content
      .replace(/^\n+/, "")
      .replace(/\n+$/, "")
      .replace(/\n\n(?=\s*(?:[-*+]|\d+\.) )/g, "\n") // keep a nested list tight under its parent text
      .replace(/\n(?=[^\n])/g, "\n    "); // indent continuation lines, not blank ones
    const parent = node.parentNode as HTMLElement;
    let prefix = `${options.bulletListMarker} `;
    if (parent.nodeName === "OL") {
      const start = Number(parent.getAttribute("start") ?? 1);
      prefix = `${start + Array.prototype.indexOf.call(parent.children, node)}. `;
    }
    return prefix + body + (node.nextSibling ? "\n" : "");
  },
});

export function tiptapToMarkdown(content: JSONContent): string {
  const html = generateHTML(content, editorExtensions);
  const markdown = turndown.turndown(html).trim();
  return markdown ? `${markdown}\n` : "";
}
