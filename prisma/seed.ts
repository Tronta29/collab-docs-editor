import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Minimal Tiptap JSON builders so sample content matches what the editor produces.
const text = (t: string, marks?: { type: string }[]) => ({ type: "text", text: t, ...(marks && { marks }) });
const p = (...content: object[]) => ({ type: "paragraph", content });
const h = (level: number, t: string) => ({ type: "heading", attrs: { level }, content: [text(t)] });
const li = (t: string) => ({ type: "listItem", content: [p(text(t))] });
const doc = (...content: object[]) => ({ type: "doc", content });

async function main() {
  // Wipe in dependency order so the seed is repeatable.
  await db.documentShare.deleteMany();
  await db.document.deleteMany();
  await db.user.deleteMany();

  const [alice, bob, carol] = await Promise.all(
    [
      { email: "alice@demo.com", name: "Alice" },
      { email: "bob@demo.com", name: "Bob" },
      { email: "carol@demo.com", name: "Carol" },
    ].map((data) => db.user.create({ data })),
  );

  await db.document.create({
    data: {
      title: "Welcome to the editor",
      ownerId: alice.id,
      content: doc(
        h(1, "Welcome"),
        p(text("This is a "), text("bold", [{ type: "bold" }]), text(" and "), text("italic", [{ type: "italic" }]), text(" sample.")),
        { type: "bulletList", content: [li("Bulleted item one"), li("Bulleted item two")] },
      ),
    },
  });

  // Alice's document shared with Bob.
  await db.document.create({
    data: {
      title: "Q3 planning notes",
      ownerId: alice.id,
      content: doc(
        h(2, "Goals"),
        { type: "orderedList", content: [li("Ship the editor"), li("Write the docs")] },
        p(text("Bob is an Editor and can change this document. Carol is a Viewer and can only read it. Only Alice can rename, share or delete it.")),
      ),
      shares: {
        create: [
          { userId: bob.id, role: "EDITOR" },
          { userId: carol.id, role: "VIEWER" },
        ],
      },
    },
  });

  await db.document.create({
    data: {
      title: "Bob's private scratchpad",
      ownerId: bob.id,
      content: doc(p(text("Only Bob can see this one."))),
    },
  });

  console.log("Seeded 3 users and 3 documents (1 shared: Alice -> Bob as Editor, Carol as Viewer).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
