import "server-only";
import type { CurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canView, type PermDoc, type ShareRole } from "@/lib/permissions";
import { nextAvailableTitle } from "@/lib/titles";

export type LoadedDocument = PermDoc & { id: string; title: string };

/**
 * Loads a document for a user, or null if it doesn't exist OR the user can't view it.
 * Callers can't tell the two apart, so a document's existence is never leaked (404).
 */
export async function getDocumentForUser(user: CurrentUser, id: string): Promise<LoadedDocument | null> {
  const row = await db.document.findUnique({
    where: { id },
    select: { id: true, title: true, ownerId: true, shares: { select: { userId: true, role: true } } },
  });
  if (!row) return null;

  const doc: LoadedDocument = {
    id: row.id,
    title: row.title,
    ownerId: row.ownerId,
    shares: row.shares,
  };
  return canView(user, doc) ? doc : null;
}

export type Collaborator = { id: string; name: string; email: string; role: ShareRole };
export type DocumentWithContent = LoadedDocument & { content: unknown; ownerName: string; collaborators: Collaborator[] };

/** Same access rule as getDocumentForUser, but also loads the content (for the editor page). */
export async function getDocumentWithContent(user: CurrentUser, id: string): Promise<DocumentWithContent | null> {
  const row = await db.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      ownerId: true,
      owner: { select: { name: true } },
      shares: {
        select: { userId: true, role: true, user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!row) return null;

  const doc: DocumentWithContent = {
    id: row.id,
    title: row.title,
    content: row.content,
    ownerId: row.ownerId,
    ownerName: row.owner.name,
    shares: row.shares.map((s) => ({ userId: s.userId, role: s.role })),
    collaborators: row.shares.map((s) => ({ id: s.userId, role: s.role, ...s.user })),
  };
  return canView(user, doc) ? doc : null;
}

const summary = { id: true, title: true, updatedAt: true } as const;

/** Dashboard lists. Scoped by the user's id in the query itself. */
export async function listDocumentsForUser(user: CurrentUser) {
  const [mine, sharedRows] = await Promise.all([
    db.document.findMany({
      where: { ownerId: user.id },
      select: { ...summary, shares: { select: { id: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.document.findMany({
      where: { shares: { some: { userId: user.id } } },
      select: {
        ...summary,
        owner: { select: { name: true } },
        shares: { where: { userId: user.id }, select: { role: true } }, // only the current user's own share
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const shared = sharedRows.map(({ shares, ...doc }) => ({ ...doc, role: shares[0].role }));
  return { mine, shared };
}

/**
 * Title for a NEW document: the wanted title, numbered if the user already OWNS one with that
 * name ("sample (2)"). Only the user's own documents count, not ones shared with them.
 */
export async function uniqueTitleForNewDocument(user: CurrentUser, wanted: string): Promise<string> {
  const owned = await db.document.findMany({ where: { ownerId: user.id }, select: { title: true } });
  return nextAvailableTitle(wanted, owned.map((d) => d.title));
}
