import { describe, expect, it } from "vitest";
import { accessOf, canDelete, canEdit, canRename, canShare, canView, isOwner, type PermDoc } from "@/lib/permissions";

const owner = { id: "alice" };
const editor = { id: "bob" };
const viewer = { id: "carol" };
const stranger = { id: "dave" };
const doc: PermDoc = {
  ownerId: "alice",
  shares: [
    { userId: "bob", role: "EDITOR" },
    { userId: "carol", role: "VIEWER" },
  ],
};

describe("permissions", () => {
  it("accessOf reports how each user relates to the document", () => {
    expect(accessOf(owner, doc)).toBe("OWNER");
    expect(accessOf(editor, doc)).toBe("EDITOR");
    expect(accessOf(viewer, doc)).toBe("VIEWER");
    expect(accessOf(stranger, doc)).toBeNull();
  });

  describe("canView: owner, editors and viewers", () => {
    it.each([
      ["owner", owner, true],
      ["editor", editor, true],
      ["viewer", viewer, true],
      ["stranger", stranger, false],
    ])("%s -> %s", (_label, user, allowed) => {
      expect(canView(user, doc)).toBe(allowed);
    });
  });

  describe("canEdit: owner and editors only", () => {
    it.each([
      ["owner", owner, true],
      ["editor", editor, true],
      ["viewer", viewer, false],
      ["stranger", stranger, false],
    ])("%s -> %s", (_label, user, allowed) => {
      expect(canEdit(user, doc)).toBe(allowed);
    });
  });

  describe("canRename / canShare / canDelete: owner only", () => {
    it.each([
      ["owner", owner, true],
      ["editor", editor, false],
      ["viewer", viewer, false],
      ["stranger", stranger, false],
    ])("%s -> %s", (_label, user, allowed) => {
      expect(canRename(user, doc)).toBe(allowed);
      expect(canShare(user, doc)).toBe(allowed);
      expect(canDelete(user, doc)).toBe(allowed);
    });
  });

  it("isOwner is true only for the owner", () => {
    expect(isOwner(owner, doc)).toBe(true);
    expect(isOwner(editor, doc)).toBe(false);
    expect(isOwner(viewer, doc)).toBe(false);
  });

  it("a viewer can see the document but nothing else", () => {
    expect([canView, canEdit, canRename, canShare, canDelete].map((check) => check(viewer, doc))).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
  });

  it("a document with no shares is visible only to its owner", () => {
    const unshared: PermDoc = { ownerId: "alice", shares: [] };
    expect(canView(owner, unshared)).toBe(true);
    expect(canView(editor, unshared)).toBe(false);
  });

  it("access is per document: a viewer here can be an editor elsewhere", () => {
    const other: PermDoc = { ownerId: "dave", shares: [{ userId: "carol", role: "EDITOR" }] };
    expect(canEdit(viewer, doc)).toBe(false);
    expect(canEdit(viewer, other)).toBe(true);
  });

  it("sharing with some users does not grant access to others", () => {
    expect(canView(stranger, { ownerId: "alice", shares: [{ userId: "bob", role: "EDITOR" }] })).toBe(false);
    expect(canView(stranger, { ownerId: "alice", shares: [{ userId: "dave", role: "VIEWER" }] })).toBe(true);
  });
});
