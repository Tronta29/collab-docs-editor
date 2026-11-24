import { describe, expect, it } from "vitest";
import { shareDocumentSchema } from "@/lib/schemas";
import { validateShare, validateUnshare } from "@/lib/sharing";

const alice = { id: "alice" }; // owner
const bob = { id: "bob" }; // already has access
const carol = { id: "carol" }; // stranger
const doc = { ownerId: "alice", sharedWith: ["bob"] };

describe("validateShare", () => {
  it("lets the owner share with an existing user who doesn't have access yet", () => {
    expect(validateShare(alice, doc, { id: "carol", name: "Carol" })).toEqual({ ok: true });
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

  it("rejects a duplicate share and names the person", () => {
    expect(validateShare(alice, doc, { id: "bob", name: "Bob" })).toEqual({ ok: false, error: "Bob already has access." });
  });

  it.each([
    ["a shared user", bob],
    ["a stranger", carol],
  ])("rejects %s trying to share", (_label, actor) => {
    expect(validateShare(actor, doc, { id: "carol", name: "Carol" })).toEqual({
      ok: false,
      error: "Only the owner can share this document.",
    });
  });

  it("checks ownership before the target, so non-owners can't probe which emails exist", () => {
    const result = validateShare(bob, doc, null);
    expect(result).toEqual({ ok: false, error: "Only the owner can share this document." });
  });
});

describe("validateUnshare", () => {
  it("lets the owner remove someone who has access", () => {
    expect(validateUnshare(alice, doc, "bob")).toEqual({ ok: true });
  });

  it("rejects removing someone who doesn't have access (including the owner themselves)", () => {
    const notShared = { ok: false, error: "That person doesn't have access to this document." };
    expect(validateUnshare(alice, doc, "carol")).toEqual(notShared);
    expect(validateUnshare(alice, doc, "alice")).toEqual(notShared);
  });

  it.each([
    ["a shared user", bob],
    ["a stranger", carol],
  ])("rejects %s trying to remove access", (_label, actor) => {
    expect(validateUnshare(actor, doc, "bob")).toEqual({ ok: false, error: "Only the owner can remove access." });
  });
});

describe("shareDocumentSchema", () => {
  it("trims and lower-cases the email", () => {
    const parsed = shareDocumentSchema.parse({ documentId: "d1", email: "  Bob@Demo.COM " });
    expect(parsed.email).toBe("bob@demo.com");
  });

  it("explains an empty email", () => {
    const result = shareDocumentSchema.safeParse({ documentId: "d1", email: "   " });
    expect(result.success ? "" : result.error.issues[0].message).toBe("Enter an email address.");
  });

  it.each(["bob", "bob@", "@demo.com", "bob demo@x.com"])("rejects invalid email %j", (email) => {
    const result = shareDocumentSchema.safeParse({ documentId: "d1", email });
    expect(result.success ? "" : result.error.issues[0].message).toBe("Enter a valid email address.");
  });
});
