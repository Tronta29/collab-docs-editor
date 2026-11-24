// All access rules live here. Pure functions: no DB, no cookies, easy to test.
// A document has one owner; `sharedWith` lists users who may view AND edit it.

export type PermUser = { id: string };
export type PermDoc = { ownerId: string; sharedWith: readonly string[] };

export function isOwner(user: PermUser, doc: PermDoc): boolean {
  return doc.ownerId === user.id;
}

export function canView(user: PermUser, doc: PermDoc): boolean {
  return isOwner(user, doc) || doc.sharedWith.includes(user.id);
}

export function canEdit(user: PermUser, doc: PermDoc): boolean {
  return canView(user, doc);
}

// Rename, share/unshare and delete are owner-only.
export function canRename(user: PermUser, doc: PermDoc): boolean {
  return isOwner(user, doc);
}

export function canShare(user: PermUser, doc: PermDoc): boolean {
  return isOwner(user, doc);
}

export function canDelete(user: PermUser, doc: PermDoc): boolean {
  return isOwner(user, doc);
}
