import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDocumentForUser } from "@/lib/documents";
import { canEdit } from "@/lib/permissions";
import { MAX_CONTENT_BYTES, updateContentSchema } from "@/lib/schemas";

const error = (message: string, status: number) => NextResponse.json({ error: message }, { status });

// Autosave endpoint. Content only: renaming goes through the owner-only rename action.
export async function PATCH(request: Request, ctx: RouteContext<"/api/documents/[id]">) {
  const user = await getCurrentUser();
  if (!user) return error("You're signed out. Sign in again.", 401);

  const { id } = await ctx.params;
  const doc = await getDocumentForUser(user, id);
  if (!doc) return error("Document not found.", 404);
  if (!canEdit(user, doc)) return error("You don't have permission to edit this document.", 403);

  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_CONTENT_BYTES) {
    return error("Document is too large to save (limit is 1 MB).", 413);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return error("Request body must be valid JSON.", 400);
  }

  const parsed = updateContentSchema.safeParse(json);
  if (!parsed.success) return error("Content isn't a valid document.", 400);

  await db.document.update({
    where: { id: doc.id },
    data: { content: parsed.data.content as Prisma.InputJsonValue },
  });
  return NextResponse.json({ ok: true });
}
