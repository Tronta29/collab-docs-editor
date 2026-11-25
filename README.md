# Docs: a lightweight collaborative document editor

A small Google Docs-style app: create and edit rich-text documents in the browser, import `.txt` / `.md` / `.docx` files, and share documents with other users by email as **Editor** or **Viewer**.

**Live demo:** https://collab-docs-editor29.vercel.app/

**Walkthrough video:** https://youtu.be/vgNmqEJ7lMA

Built with Next.js (App Router), TypeScript (strict), Tiptap, Prisma + PostgreSQL (Neon), Tailwind CSS, Zod and Vitest.

## Demo accounts

Authentication is **mocked** on purpose. There are no passwords: open the app and use **Sign in as…**.

| Name  | Email            |
| ----- | ---------------- |
| Alice | alice@demo.com   |
| Bob   | bob@demo.com     |
| Carol | carol@demo.com   |

The seed data gives Alice two documents and Bob one private document. Alice's **"Q3 planning notes"** is shared with **Bob as Editor** and **Carol as Viewer**, so you can see both roles right away: sign in as Bob and you can edit it, sign in as Carol and it opens read-only.

## Two-minute reviewer path

1. Sign in as **Alice**. You land on the dashboard: **My documents** and **Shared with me**.
2. Click **New document**. In the editor, type something and try bold / italic / underline, H1-H3 and both list types. Watch the status change: *Unsaved changes → Saving… → Saved*. Refresh: everything is still there.
3. Go back to the dashboard and use **Import file** with a file from [`samples/`](samples) (`sample.txt`, `sample.md`, `sample.docx`). It becomes a new, editable document.
4. Open a document you created in step 2 (Q3 planning notes is already shared, see above) and click **Share**. Share it with `bob@demo.com` as **Editor**, then with `carol@demo.com` as **Viewer**. Try `alice@demo.com`, an unknown email and a duplicate to see the error messages, and use the role dropdown next to a person to change their role.
5. Click **Switch user** and sign in as **Bob**. The document is under **Shared with me** with an *Editor* badge and Alice as owner. Bob can edit it but cannot rename, share or delete it.
6. Sign in as **Carol**. The same document shows a *Viewer* badge. It opens read-only ("View only", no toolbar, nothing is saved), and the server rejects writes from her.
7. Back as **Alice**, remove Carol from the **Share** panel. As Carol, reload the document URL: you get a 404, never the data.
8. Open any document and try **Export**: *Markdown (.md)* downloads `<title>.md`; *PDF (print)* opens the print dialog showing only the title and content.

## Features

- Create, rename, delete, edit and reopen documents. Content is stored as Tiptap JSON in a Postgres JSONB column, so formatting persists.
- Formatting: bold, italic, underline, H1/H2/H3, bulleted and numbered lists, undo/redo.
- Autosave 1.5 s after you stop typing, with a visible *Saving… / Saved / Error (retry)* status and a warning before leaving with unsaved changes.
- File import into a **new** document: `.txt`, `.md`, `.docx`, **max 2 MB**. Anything else is rejected with a clear message (wrong type, empty file, corrupt file, too large).
- Sharing by email with **roles**. One owner per document. *Editors* can view and edit content; *Viewers* can only read (read-only editor, no toolbar, writes rejected by the server with 403). Only the owner can rename, share, change roles, remove people or delete. Users without access get a 404.
- **Export** from the editor: *Markdown (.md)* downloads the document as `<title>.md` (viewers can export too; pending edits are saved first), and *PDF (print)* opens the browser's print dialog with a clean print layout (just the title and content): choose "Save as PDF". Tip: turn off "Headers and footers" in the print dialog for a cleaner page.
- Duplicate titles on create/import are numbered like Google Drive: `sample`, `sample (2)`, `sample (3)`.

## Local setup

Requirements: **Node 20.9+** (developed on Node 24) and a PostgreSQL database. A free [Neon](https://neon.tech) project is the easiest, but any Postgres works.

```bash
# 1. Install (also runs `prisma generate`)
npm install

# 2. Configure the database
cp .env.example .env
#    then edit .env:
#    DATABASE_URL = pooled connection string (Neon: the host with "-pooler")
#    DIRECT_URL   = direct connection string (used for migrations)
#    With a plain local Postgres, use the same URL for both.

# 3. Create the tables
npm run db:deploy

# 4. Load the demo users and sample documents
npm run db:seed        # WARNING: wipes all users and documents first

# 5. Run
npm run dev            # http://localhost:3000
```

`.env` is git-ignored. Never commit real connection strings.

## Tests and checks

```bash
npm test               # Vitest, 122 tests, no database needed
npm run typecheck
npm run lint
npm run build          # applies pending migrations, then builds (needs the database)
npm run build:app      # build only, no migrations
```

The tests cover the pure logic: permissions (owner / editor / viewer / stranger), file-import conversion (including a real `.docx` fixture and rejection of bad input), share and role-change validation, title numbering, and the Markdown export.

## Deploy to Vercel + Neon

1. Create a Neon project and copy both connection strings (pooled and direct).
2. Push this repo to GitHub and import it in Vercel (framework: Next.js, default settings).
3. Add two environment variables in Vercel: `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
4. Deploy. The build command is `npm run build`, which runs `prisma migrate deploy` (applies only committed migrations, safe to repeat) and then `next build`.
5. **Seed once, manually**, so the demo accounts exist. The seed is never run automatically. From your machine, point `.env` at the production database, run `npm run db:seed`, then restore your local `.env`. Remember the seed deletes existing data.

Imports are capped at 2 MB, which fits under Vercel's request body limit for serverless functions.

## Import details

| Type    | How it is converted                                                       |
| ------- | ------------------------------------------------------------------------- |
| `.txt`  | HTML-escaped. Blank lines separate paragraphs; single newlines become line breaks. |
| `.md`   | `marked`. Raw HTML in the Markdown is dropped.                            |
| `.docx` | `mammoth`. Headings, bold/italic/underline and lists are kept; images and tables are not. |

The HTML is converted to Tiptap JSON using the same extension list as the editor, so an imported document is identical in structure to one typed by hand. The file name (without extension) becomes the title. The type is checked by extension **and** content (for example, a `.docx` must really be a Word file). A converted document must stay under about 1 MB so it can still be autosaved.

## Project layout

```
prisma/            schema, migration, seed
samples/           files to try the import with
src/app/           pages (dashboard, sign-in, editor) and API routes (autosave, import)
src/components/    editor, toolbar, share panel, forms
src/lib/           permissions.ts (all access rules), sharing.ts, titles.ts,
                   import/convert.ts, server actions, Zod schemas, data access
src/tests/         Vitest tests
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for design decisions, trade-offs and known limitations.
