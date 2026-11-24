import { describe, expect, it } from "vitest";
import type { PermDoc } from "@/lib/permissions";
import { shareDocumentSchema, shareRoleSchema, updateShareRoleSchema } from "@/lib/schemas";
import { validateRoleChange, validateShare, validateUnshare } from "@/lib/sharing";

const alice = { id: "alice" }; // owner
const bob = { id: "bob" }; // editor
const carol = { id: "carol" }; // viewer
const dave = { id: "dave" }; // stranger
const doc: PermDoc = {
  ownerId: "alice",
  shares: [
    { userId: "bob", role: "EDITOR" },
    { userId: "carol", role: "VIEWER" },
  ],
};

describe("validateShare", () => {
  it("lets the owner share with an existing user who doesn't have access yet", () => {
    expect(validateShare(alice, doc, { id: "dave", name: "Dave" })).toEqual({ ok: true });
  });

  it("rejects an unknown email", () => {
    expect(validateShare(alice, doc, null)).toEqual({ ok: false, error: "No user found with that email." });
  });

  it("rejects sharing with yourself", () => {
    expect(validateShare(alice, doc, { id: "alice", name: "Alice" })).toEqual({
      ok: false,
      error: "You already own this document.",
    });
  });

  it.each([
    ["an editor", { id: "bob", name: "Bob" }],
    ["a viewer", { id: "carol", name: "Carol" }],
  ])("rejects a duplicate share with %s and names the person", (_label, target) => {
    expect(validateShare(alice, doc, target)).toEqual({ ok: false, error: `${target.name} already has access.` });
  });

  it.each([
    ["an editor", bob],
    ["a viewer", carol],
    ["a stranger", dave],
  ])("rejects %s trying to share", (_label, actor) => {
    expect(validateShare(actor, doc, { id: "erin", name: "Erin" })).toEqual({
      ok: false,
      error: "Only the owner can share this document.",
    });
  });

  it("checks ownership before the target, so non-owners can't probe which emails exist", () => {
    expect(validateShare(bob, doc, null)).toEqual({ ok: false, error: "Only the owner can share this document." });
  });
});

describe("validateRoleChange", () => {
  it("lets the owner promote a viewer and demote an editor", () => {
    expect(validateRoleChange(alice, doc, "carol", "EDITOR")).toEqual({ ok: true });
    expect(validateRoleChange(alice, doc, "bob", "VIEWER")).toEqual({ ok: true });
  });

  it("rejects setting the role someone already has", () => {
    expect(validateRoleChange(alice, doc, "bob", "EDITOR")).toEqual({
      ok: false,
      error: "They are already Editors on this document.",
    });
    expect(validateRoleChange(alice, doc, "carol", "VIEWER").ok).toBe(false);
  });

  it("rejects changing the role of someone without access (including the owner)", () => {
    const noAccess = { ok: false, error: "That person doesn't have access to this document." };
    expect(validateRoleChange(alice, doc, "dave", "VIEWER")).toEqual(noAccess);
    expect(validateRoleChange(alice, doc, "alice", "VIEWER")).toEqual(noAccess);
  });

  it.each([
    ["an editor", bob],
    ["a viewer", carol],
    ["a stranger", dave],
  ])("rejects %s trying to change roles, even to promote themselves", (_label, actor) => {
    expect(validateRoleChange(actor, doc, actor.id, "EDITOR")).toEqual({
      ok: false,
      error: "Only the owner can change roles.",
    });
  });
});

describe("validateUnshare", () => {
  it("lets the owner remove an editor or a viewer", () => {
    expect(validateUnshare(alice, doc, "bob")).toEqual({ ok: true });
    expect(validateUnshare(alice, doc, "carol")).toEqual({ ok: true });
  });

  it("rejects removing someone who doesn't have access (including the owner themselves)", () => {
    const notShared = { ok: false, error: "That person doesn't have access to this document." };
    expect(validateUnshare(alice, doc, "dave")).toEqual(notShared);
    expect(validateUnshare(alice, doc, "alice")).toEqual(notShared);
  });

  it.each([
    ["an editor", bob],
    ["a viewer", carol],
    ["a stranger", dave],
  ])("rejects %s trying to remove access", (_label, actor) => {
    expect(validateUnshare(actor, doc, "bob")).toEqual({ ok: false, error: "Only the owner can remove access." });
  });
});

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? "" : (result.error?.issues[0].message ?? "");

describe("role validation (Zod)", () => {
  it.each(["VIEWER", "EDITOR"])("accepts %s", (role) => {
    expect(shareRoleSchema.parse(role)).toBe(role);
  });

  it.each(["ADMIN", "OWNER", "viewer", "editor", "", null, undefined, 1])("rejects %j", (role) => {
    const result = shareRoleSchema.safeParse(role);
    expect(result.success).toBe(false);
    expect(firstError(result)).toBe("Choose Viewer or Editor.");
  });

  it("requires a valid role when sharing", () => {
    const base = { documentId: "d1", email: "bob@demo.com" };
    expect(shareDocumentSchema.safeParse({ ...base, role: "VIEWER" }).success).toBe(true);
    expect(firstError(shareDocumentSchema.safeParse({ ...base, role: "ROOT" }))).toBe("Choose Viewer or Editor.");
    expect(shareDocumentSchema.safeParse(base).success).toBe(false);
  });

  it("requires a document, a person and a valid role when changing a role", () => {
    expect(updateShareRoleSchema.safeParse({ documentId: "d1", userId: "u1", role: "EDITOR" }).success).toBe(true);
    expect(updateShareRoleSchema.safeParse({ documentId: "d1", userId: "u1", role: "GOD" }).success).toBe(false);
    expect(updateShareRoleSchema.safeParse({ documentId: "d1", userId: "", role: "EDITOR" }).success).toBe(false);
    expect(updateShareRoleSchema.safeParse({ documentId: "", userId: "u1", role: "EDITOR" }).success).toBe(false);
  });
});

describe("shareDocumentSchema email", () => {
  const withEmail = (email: string) => ({ documentId: "d1", role: "EDITOR", email });

  it("trims and lower-cases the email", () => {
    expect(shareDocumentSchema.parse(withEmail("  Bob@Demo.COM ")).email).toBe("bob@demo.com");
  });

  it("explains an empty email", () => {
    expect(firstError(shareDocumentSchema.safeParse(withEmail("   ")))).toBe("Enter an email address.");
  });

  it.each(["bob", "bob@", "@demo.com", "bob demo@x.com"])("rejects invalid email %j", (email) => {
    expect(firstError(shareDocumentSchema.safeParse(withEmail(email)))).toBe("Enter a valid email address.");
  });
});
