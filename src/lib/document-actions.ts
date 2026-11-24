"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDocumentForUser, uniqueTitleForNewDocument } from "@/lib/documents";
import { canDelete, canRename } from "@/lib/permissions";
import { createDocumentSchema, deleteDocumentSchema, renameDocumentSchema } from "@/lib/schemas";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };
const NOT_FOUND = "Document not found.";

export async function createDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createDocumentSchema.safeParse({ title: formData.get("title") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const doc = await db.document.create({
    data: { title: await uniqueTitleForNewDocument(user, parsed.data.title), ownerId: user.id, content: EMPTY_DOC },
    select: { id: true },
  });
  revalidatePath("/");
  redirect(`/docs/${doc.id}`);
}

export async function renameDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = renameDocumentSchema.safeParse({ id: formData.get("id"), title: formData.get("title") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const doc = await getDocumentForUser(user, parsed.data.id);
  if (!doc) return { error: NOT_FOUND };
  if (!canRename(user, doc)) return { error: "Only the owner can rename this document." };

  await db.document.update({ where: { id: doc.id }, data: { title: parsed.data.title } });
  revalidatePath("/");
  revalidatePath(`/docs/${doc.id}`);
  return { ok: true };
}

export async function deleteDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = deleteDocumentSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: NOT_FOUND };

  const doc = await getDocumentForUser(user, parsed.data.id);
  if (!doc) return { error: NOT_FOUND };
  if (!canDelete(user, doc)) return { error: "Only the owner can delete this document." };

  await db.document.delete({ where: { id: doc.id } });
  revalidatePath("/");
  return { ok: true };
}
