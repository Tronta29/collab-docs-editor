import { describe, expect, it } from "vitest";
import { canDelete, canEdit, canRename, canShare, canView, isOwner } from "@/lib/permissions";

const owner = { id: "alice" };
const shared = { id: "bob" };
const stranger = { id: "carol" };
const doc = { ownerId: "alice", sharedWith: ["bob"] };

describe("permissions", () => {
  describe("canView / canEdit (owner and shared users)", () => {
    it.each([
      ["owner", owner, true],
      ["shared user", shared, true],
      ["stranger", stranger, false],
    ])("%s -> %s", (_label, user, allowed) => {
      expect(canView(user, doc)).toBe(allowed);
      expect(canEdit(user, doc)).toBe(allowed);
    });
  });

  describe("canRename / canShare / canDelete (owner only)", () => {
    it.each([
      ["owner", owner, true],
      ["shared user", shared, false],
      ["stranger", stranger, false],
    ])("%s -> %s", (_label, user, allowed) => {
      expect(canRename(user, doc)).toBe(allowed);
      expect(canShare(user, doc)).toBe(allowed);
      expect(canDelete(user, doc)).toBe(allowed);
    });
  });

  it("isOwner is true only for the owner", () => {
    expect(isOwner(owner, doc)).toBe(true);
    expect(isOwner(shared, doc)).toBe(false);
  });

  it("a document with no shares is visible only to its owner", () => {
    const unshared = { ownerId: "alice", sharedWith: [] };
    expect(canView(owner, unshared)).toBe(true);
    expect(canView(shared, unshared)).toBe(false);
  });

  it("sharing with one user does not grant access to another", () => {
    expect(canView(stranger, { ownerId: "alice", sharedWith: ["bob"] })).toBe(false);
    expect(canView(stranger, { ownerId: "alice", sharedWith: ["bob", "carol"] })).toBe(true);
  });
});
