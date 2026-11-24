import { canShare, type PermDoc, type PermUser, type ShareRole } from "@/lib/permissions";

// Pure share / change-role / unshare rules (no DB), so they can be tested directly. The server
// actions load the data, call these, and only write to the DB when the result is ok.
// The owner check always comes first so non-owners learn nothing about which emails exist.

export type ShareTarget = { id: string; name: string } | null;
export type RuleResult = { ok: true } | { ok: false; error: string };

export const ROLE_LABEL: Record<ShareRole, string> = { VIEWER: "Viewer", EDITOR: "Editor" };

const hasAccess = (doc: PermDoc, userId: string) => doc.shares.some((s) => s.userId === userId);

export function validateShare(actor: PermUser, doc: PermDoc, target: ShareTarget): RuleResult {
  if (!canShare(actor, doc)) return { ok: false, error: "Only the owner can share this document." };
  if (!target) return { ok: false, error: "No user found with that email." };
  if (target.id === doc.ownerId) return { ok: false, error: "You already own this document." };
  if (hasAccess(doc, target.id)) return { ok: false, error: `${target.name} already has access.` };
  return { ok: true };
}

export function validateRoleChange(actor: PermUser, doc: PermDoc, targetUserId: string, newRole: ShareRole): RuleResult {
  if (!canShare(actor, doc)) return { ok: false, error: "Only the owner can change roles." };
  const current = doc.shares.find((s) => s.userId === targetUserId);
  if (!current) return { ok: false, error: "That person doesn't have access to this document." };
  if (current.role === newRole) return { ok: false, error: `They are already ${ROLE_LABEL[newRole]}s on this document.` };
  return { ok: true };
}

export function validateUnshare(actor: PermUser, doc: PermDoc, targetUserId: string): RuleResult {
  if (!canShare(actor, doc)) return { ok: false, error: "Only the owner can remove access." };
  if (!hasAccess(doc, targetUserId)) return { ok: false, error: "That person doesn't have access to this document." };
  return { ok: true };
}
