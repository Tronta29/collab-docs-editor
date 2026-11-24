# Architecture

## Stack, and why

| Choice | Why |
| --- | --- |
| **Next.js (App Router) + TypeScript strict** | Server components and server actions keep data access on the server, next to the permission checks. One deployable unit for Vercel. |
| **Tiptap (StarterKit)** | A real rich-text editor with a JSON document model, which maps cleanly onto a JSONB column. Tiptap 3's StarterKit already includes Underline, lists, headings and undo/redo. |
| **Prisma + PostgreSQL (Neon)** | Typed queries, committed migrations, free hosted Postgres for local dev and production. Pinned to Prisma 7.10.1 (the stable line) because npm's `latest` tag pointed at an 8.0 release candidate. |
| **Tailwind CSS** | Fast, consistent UI with no component library to learn. One light theme. |
| **Zod** | Every input (forms, JSON bodies, uploads) is validated at the boundary with readable messages. |
| **Vitest** | Fast tests for the pure logic. |
| `mammoth`, `marked` | `.docx` and Markdown to HTML, as required. |
| `turndown` | HTML to Markdown for the Markdown export. Runs on the server (it brings its own small DOM), no browser needed. |

## Data model

```
User            id, email (unique), name
Document        id, title, content (Json / JSONB, Tiptap doc), ownerId -> User, createdAt, updatedAt
DocumentShare   id, documentId -> Document, userId -> User, role (VIEWER | EDITOR, default EDITOR), createdAt, unique(documentId, userId)
```

- One owner per document (`Document.ownerId`). The owner is never a `DocumentShare` row.
- A `DocumentShare` row gives a user access with a **role**: `VIEWER` can read, `EDITOR` can read and edit content. The column defaults to `EDITOR`, so shares that existed before roles were added kept working unchanged (the migration is additive). Deleting a document or user cascades to shares.
- The unique `(documentId, userId)` index makes duplicate shares impossible even under double-clicks; the action maps the DB error to a friendly message.

## Permissions live in one place

`src/lib/permissions.ts` holds pure functions: `canView`, `canEdit`, `canRename`, `canShare`, `canDelete` (plus `isOwner` and `accessOf`). They take a user id and `{ ownerId, shares: [{ userId, role }] }` and touch no database, so they are trivial to test (owner / editor / viewer / stranger for every function). `canView` is true for the owner and every share; `canEdit` only for the owner and `EDITOR` shares; the rest are owner-only.

Everything else goes through them:

- `lib/documents.ts` is the only code that loads a document **for a user**. `getDocumentForUser` and `getDocumentWithContent` return `null` when the document does not exist **or** the user cannot view it, so the two cases are indistinguishable. Pages turn that into `notFound()` (404); the API into a 404 JSON error. Existence is never leaked.
- Owner-only actions (rename, share, change role, unshare, delete) call `canRename` / `canShare` / `canDelete` after loading. A shared user gets a clear "Only the owner can…" error (the 403 case).
- The autosave endpoint checks `canEdit`, so a viewer who calls it directly gets a 403 and nothing is written. The UI mirrors that: viewers get a read-only editor (`editable: false`), no toolbar, no autosave and a "View only" badge, but the UI is a convenience, not the guard.
- `lib/sharing.ts` holds the pure share / change-role / unshare rules (self-share, duplicate, unknown user, non-owner, role unchanged). It checks ownership first, so a non-owner cannot probe which emails exist.
- The dashboard lists are scoped by user id inside the query itself.
- The current user always comes from the cookie via `lib/auth.ts`. No server code accepts a user id from the client.

## Content storage and autosave

Content is the Tiptap JSON document, stored as JSONB. Reloading a page re-creates exactly the same editor state, so formatting always survives.

Autosave (`components/Editor.tsx`):

- Every edit bumps a version counter and restarts a 1.5 s debounce timer.
- A save sends the latest JSON to `PATCH /api/documents/[id]` and loops until the server has the newest version. Only one request is in flight at a time, so older content can never overwrite newer content.
- Status: *Unsaved changes → Saving… → Saved*, or *Error: <message> — retry*.
- `beforeunload` warns while anything is unsaved. Navigating away inside the app flushes pending edits instead of dropping them.
- The endpoint validates with Zod (must be a Tiptap `doc` object) and rejects bodies over 1 MB (413).
- The title is saved separately (owner only, on Enter, blur or the Rename button), so a title edit is never lost either.

## Import pipeline

`src/lib/import/convert.ts` is one pure function: `(fileName, bytes) -> { title, content }`.

1. Check the extension (`.txt`, `.md`, `.docx`), non-empty, and at most 2 MB.
2. Check the content matches the type: a `.docx` must be a zip that Word-parsing accepts; text files must be valid UTF-8 with no binary data, and a PDF/zip renamed to `.txt` is refused.
3. Convert to HTML: text is escaped into paragraphs; Markdown via `marked` (raw HTML dropped, `<script>`/`<style>` removed with their contents); `.docx` via `mammoth`.
4. HTML to Tiptap JSON with `generateJSON` and the **same extension list as the editor** (`lib/editor-extensions.ts`). The editor schema is the sanitizer: unknown tags and attributes (scripts, `onclick`, styles) cannot survive. Link `href`s are additionally limited to `http`, `https` and `mailto`.
5. Reject files with no text, or whose converted content would exceed the 1 MB autosave limit.

The API route (`POST /api/documents/import`) only does auth, upload parsing and persistence. New documents are always owned by the current user.

## Export

A small extra added after the core features (the main stretch item was roles).

- **Markdown:** `GET /api/documents/[id]/export?format=md`. It loads the document through the same access-checked function as the editor page, so anyone who can view it (viewers included) can export it and strangers get the same 404. `lib/export/markdown.ts` is pure: Tiptap JSON to HTML with `generateHTML` and the **same extension list as the editor and importer**, then HTML to Markdown with `turndown`. The file is named from the title by `safeFileName` (no path separators, reserved characters or control characters, length-capped) and sent with both an ASCII `filename` and a UTF-8 `filename*`, so Turkish and other non-ASCII titles survive.
- **Underline:** Markdown has no underline. It is exported as inline HTML (`<u>…</u>`), which GitHub and most renderers display, so the formatting is not lost silently. Our own Markdown importer drops raw HTML but keeps the text, so re-importing an export loses only the underline.
- **Fresh content:** the export reads what is saved on the server, so the editor first flushes pending autosave edits and cancels the export with a message if that save fails. Viewers have nothing to flush.
- **PDF:** no server library. "PDF (print)" calls `window.print()`; a print stylesheet (`print:hidden` on the app chrome plus a small `@media print` block) leaves only the title and content on clean white pages, and the user picks "Save as PDF". The trade-off: pagination, fonts and the optional browser header/footer are the browser's, not ours.

## What I prioritized, and why

1. **Access control correctness.** It is the part of this app that can be most wrong, and the easiest to test. One pure module, used by every entry point, with tests.
2. **Never losing the user's work.** Serialized autosave, a visible status, leave warnings, flush-on-navigate, title saved on blur.
3. **Robust inputs.** Zod at every boundary, real content checks on uploads, readable errors for empty titles, oversized or corrupt files, unknown users, self-shares and duplicates. Unexpected failures (such as the database being down) become friendly messages (`error.tsx`, guarded actions, JSON errors from routes) with no stack traces.
4. **Testing the logic, not the framework.** Pure functions were extracted so the important rules (permissions, share and role rules, conversion, title numbering) are tested without a database or browser: 109 tests.
5. **A small, readable codebase** over clever abstractions: short files, no unnecessary dependencies.

## Deliberate scope cuts

Not built, as agreed: real-time multi-user editing, comments, real authentication, version history, folders, mobile-specific layouts. The one optional stretch item was **viewer/editor roles** (built, see above). Export (Markdown and print-to-PDF) was added afterwards as a small extra; roles are the main stretch item.

Also left out on purpose: soft delete / trash, search and pagination, invitations to people without an account, ownership transfer.

## Known limitations

- **Mock auth is unsigned.** The `uid` cookie is the plain user id (httpOnly, `sameSite=lax`). Anyone can impersonate another user by editing it. Acceptable for a demo; the id is still re-checked against the database on every request.
- **Last write wins.** Two people editing the same document can overwrite each other's autosaves. There is no conflict detection and no live updates; a collaborator must refresh to see changes.
- **Revoked access and role changes are not live.** If access is removed while the person has the editor open, their next autosave fails with "Document not found" and a reload gives a 404. If an editor is demoted to viewer, their next autosave fails with "view-only access"; a reload shows the read-only editor. Someone promoted to editor has to reload to get the toolbar.
- **1 MB content limit.** Autosave rejects content over 1 MB, so imports whose converted content exceeds that are refused (plain text beyond roughly 700-800 KB), even though the file limit is 2 MB. The alternative would have been documents that import fine but can never be saved.
- **Images and tables are dropped on import.** The editor schema has no image or table nodes: images disappear and table cells become plain text.
- **Raw HTML in Markdown is stripped entirely**, including harmless tags such as `<u>`.
- **No zip-bomb protection.** A 2 MB `.docx` can expand to a much larger size in memory during conversion.
- **Title uniqueness is cosmetic.** Numbering (`sample (2)`) is applied on create/import only and is not enforced in the database, so two simultaneous imports could still get the same title. Renaming deliberately allows duplicates.
- **Sharing reveals which emails exist** (to the owner, who is signed in), because the spec asks for a clear "unknown user" error. The share panel also hard-codes the three demo emails as a hint.
- **Only two roles.** There is no per-person "can comment" or "can share" level, and editors can't see who else has access.
- **Export is basic.** Markdown keeps headings, bold, italic, links, line breaks and lists; underline is kept as `<u>`. There is no DOCX export, and PDF comes from the browser's print dialog (no server-rendered PDF, so page breaks and the browser's header/footer are outside our control).
- **Seed is destructive** (it clears users and documents first) and is meant for demo setup only.

## What I would build next with 2-4 more hours

1. **Safer concurrent editing:** an `updatedAt`/version check on save that returns 409 and prompts to reload, or Yjs for real-time editing.
2. **Real authentication** (Auth.js or iron-session with signed, encrypted cookies) replacing the mock cookie.
   Also: a server-rendered PDF and DOCX export for exact page layout.
3. **Integration tests** for the server actions and API routes against a test database, plus a Playwright smoke test of the reviewer path.
4. **Import hardening:** cap the uncompressed size of `.docx`, support images and tables in the schema, stream large uploads.
5. **Dashboard polish:** search, sorting, pagination, a trash with undo for deletes, and live "who has this open" hints.
