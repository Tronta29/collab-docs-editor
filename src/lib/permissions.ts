// All access rules live here. Pure functions: no DB, no cookies, easy to test.
// A document has one owner. Other users get access through shares, each with a role:
// VIEWER can read; EDITOR can read and edit content. Only the owner can rename, share
// (add / change role / remove) or delete.

export type ShareRole = "VIEWER" | "EDITOR";
export type PermUser = { id: string };
export type PermShare = { userId: string; role: ShareRole };
export type PermDoc = { ownerId: string; shares: readonly PermShare[] };

export type Access = "OWNER" | ShareRole | null;

/** The user's relationship to the document, or null for a stranger. */
export function accessOf(user: PermUser, doc: PermDoc): Access {
  if (doc.ownerId === user.id) return "OWNER";
  return doc.shares.find((s) => s.userId === user.id)?.role ?? null;
}

export function isOwner(user: PermUser, doc: PermDoc): boolean {
  return accessOf(user, doc) === "OWNER";
}

export function canView(user: PermUser, doc: PermDoc): boolean {
  return accessOf(user, doc) !== null;
}

export function canEdit(user: PermUser, doc: PermDoc): boolean {
  const access = accessOf(user, doc);
  return access === "OWNER" || access === "EDITOR";
}

export function canRename(user: PermUser, doc: PermDoc): boolean {
  return isOwner(user, doc);
}

export function canShare(user: PermUser, doc: PermDoc): boolean {
  return isOwner(user, doc);
}

export function canDelete(user: PermUser, doc: PermDoc): boolean {
  return isOwner(user, doc);
}
