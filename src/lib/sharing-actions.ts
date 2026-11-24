"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDocumentForUser } from "@/lib/documents";
import { shareDocumentSchema, unshareDocumentSchema } from "@/lib/schemas";
import { validateShare, validateUnshare } from "@/lib/sharing";

const NOT_FOUND = "Document not found.";

function refresh(documentId: string) {
  revalidatePath("/"); // "Shared with N people" and the recipient's "Shared with me"
  revalidatePath(`/docs/${documentId}`);
}

export async function shareDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = shareDocumentSchema.safeParse({
    documentId: formData.get("documentId"),
    email: formData.get("email") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // null for missing docs and for strangers alike.
  const doc = await getDocumentForUser(user, parsed.data.documentId);
  if (!doc) return { error: NOT_FOUND };

  const target = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true },
  });

  const check = validateShare(user, doc, target);
  if (!check.ok || !target) return { error: check.ok ? "No user found with that email." : check.error };

  try {
    await db.documentShare.create({ data: { documentId: doc.id, userId: target.id } });
  } catch (e) {
    // Two quick clicks: the unique (documentId, userId) index catches the second one.
    if ((e as { code?: string }).code === "P2002") return { error: `${target.name} already has access.` };
    throw e;
  }
  refresh(doc.id);
  return { ok: true };
}

export async function unshareDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = unshareDocumentSchema.safeParse({
    documentId: formData.get("documentId"),
    userId: formData.get("userId"),
  });
  if (!parsed.success) return { error: NOT_FOUND };

  const doc = await getDocumentForUser(user, parsed.data.documentId);
  if (!doc) return { error: NOT_FOUND };

  const check = validateUnshare(user, doc, parsed.data.userId);
  if (!check.ok) return { error: check.error };

  await db.documentShare.deleteMany({
    where: { documentId: doc.id, userId: parsed.data.userId },
  });
  refresh(doc.id);
  return { ok: true };
}
