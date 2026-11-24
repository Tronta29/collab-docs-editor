import { canShare, type PermDoc, type PermUser } from "@/lib/permissions";

// Pure share/unshare rules (no DB), so they can be tested directly. The server actions load
// the data, call these, and only write to the DB when the result is ok.
// The owner check always comes first so non-owners learn nothing about which emails exist.

export type ShareTarget = { id: string; name: string } | null;
export type RuleResult = { ok: true } | { ok: false; error: string };

export function validateShare(actor: PermUser, doc: PermDoc, target: ShareTarget): RuleResult {
  if (!canShare(actor, doc)) return { ok: false, error: "Only the owner can share this document." };
  if (!target) return { ok: false, error: "No user found with that email." };
  if (target.id === doc.ownerId) return { ok: false, error: "You already own this document." };
  if (doc.sharedWith.includes(target.id)) return { ok: false, error: `${target.name} already has access.` };
  return { ok: true };
}

export function validateUnshare(actor: PermUser, doc: PermDoc, targetUserId: string): RuleResult {
  if (!canShare(actor, doc)) return { ok: false, error: "Only the owner can remove access." };
  if (!doc.sharedWith.includes(targetUserId)) return { ok: false, error: "That person doesn't have access to this document." };
  return { ok: true };
}
