import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentWithContent } from "@/lib/documents";
import { attachmentHeader, safeFileName } from "@/lib/export/filename";
import { tiptapToMarkdown } from "@/lib/export/markdown";
import { exportFormatSchema } from "@/lib/schemas";
import type { JSONContent } from "@tiptap/react";

const error = (message: string, status: number) => NextResponse.json({ error: message }, { status });

// GET /api/documents/[id]/export?format=md  ->  downloads "<title>.md".
// Anyone who can view the document can export it, viewers included. getDocumentWithContent
// applies canView, so a stranger gets the same 404 as for a missing document.
async function handleGET(request: Request, ctx: RouteContext<"/api/documents/[id]/export">) {
  const user = await getCurrentUser();
  if (!user) return error("You're signed out. Sign in again.", 401);

  const format = exportFormatSchema.safeParse(new URL(request.url).searchParams.get("format") ?? "md");
  if (!format.success) return error('Unsupported export format. Use "md".', 400);

  const { id } = await ctx.params;
  const doc = await getDocumentWithContent(user, id);
  if (!doc) return error("Document not found.", 404);

  const markdown = tiptapToMarkdown(doc.content as JSONContent);
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": attachmentHeader(safeFileName(doc.title, "md")),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request, ctx: RouteContext<"/api/documents/[id]/export">) {
  try {
    return await handleGET(request, ctx);
  } catch (e) {
    console.error("Export failed", e);
    return error("Couldn't export this document right now. Please try again.", 500);
  }
}
