# AI workflow

## Tools used

- **Claude Code (in VS Code):** implementation. It wrote the code, ran the type checker, linter, tests and builds, and ran `curl` and headless-browser checks against local builds.
- **Claude (chat), in a separate session:** planning, choosing the stack and the scope cuts, writing the prompt for each phase, and reviewing each phase report before I tested it. Having a second session review the first one's output gave me a "second pair of eyes" that had not written the code.

No other AI tools were used.

## How I worked

1. **Phased plan, agreed up front.** Before any code, I fixed the stack (Next.js, Tiptap, Prisma + Neon Postgres, Vercel), the scope and an explicit out-of-scope list. Phase 0 was a proposal only (folder structure, Prisma schema, phase plan), and I approved it before any code was written. Then: setup/schema/seed/mock auth, dashboard, editor + autosave, file import, sharing, and a final quality + docs pass.
2. **Stop after every phase.** Each phase ended with a report: what was built, commands to run, a manual checklist, and decisions I should know about. I read the report, then tested in the browser.
3. **I tested every phase in the browser before committing.** One commit per phase, plus separate commits for follow-up fixes. The AI never committed ahead of my verification.
4. **Scope control.** Real-time editing, comments, real auth and version history were ruled out at the start. Extras were only started after the six core phases were done, verified and deployed. The main stretch item is **viewer/editor roles**: I chose it over export because it deepens the sharing and access logic that the brief evaluates, instead of adding another button. Markdown export and print-to-PDF came afterwards as a small extra, because they reused the existing editor extension list and were cheap to add.

### Time spent (prompting + reviewing + testing)

| Step | Time |
| --- | --- |
| Plan, setup, database, mock auth | ~20 min |
| Dashboard (create, rename, delete) | ~5 min |
| Editor, autosave, light-theme fix | ~12 min |
| File import + title numbering | ~15 min |
| Sharing | ~5 min |
| Error pages, deploy prep, docs | ~8 min |
| GitHub + Vercel deploy | ~10 min |
| Placeholder bug fix | ~15 min |
| Viewer/editor roles | ~12 min |
| Markdown export + print-to-PDF | ~16 min |
| UI polish | ~17 min |
| **Total** | **~2.5 hours** |

## Where I changed or corrected the AI's output

These were requests I made beyond, or against, what the AI first produced:

- **Permission tests moved to Phase 2.** The plan put tests at the end; I asked for the permission tests immediately, because the module is pure and cheap to test, and it would protect every later phase from regressions.
- **Mock auth limitation made explicit.** The `uid` cookie is unsigned, so a user could impersonate someone by editing it. That is acceptable for a demo, but I asked for it to be stated in the code and in `ARCHITECTURE.md` rather than left for a reviewer to discover.
- **Title saved on Enter and on blur.** The first editor only saved the title through the Rename button, so typing a new title and clicking away silently lost it.
- **Light-theme fix.** The editor and header were unreadable (white text on white) on my machine in OS dark mode. I spotted it in the browser; the cause was the dark-mode CSS that ships with the Next.js template overriding the app's text colors. I also asked for explicit heading and list styles, because Tailwind's reset made H1 and bullet lists look like plain paragraphs.
- **Placeholder text overlapping typed text.** On the deployed site I saw the "Start writing…" placeholder stay visible behind what I typed. Claude Code traced it to a CSS selector that also matched non-empty paragraphs and replaced it with Tiptap's Placeholder extension.
- **Google Drive-style title numbering.** After importing the same sample file several times I noticed identical "sample" documents on the dashboard and asked for `sample`, `sample (2)`, `sample (3)`, only against the user's own documents, case-insensitive, reusing gaps, and without changing rename.
- **Seed data that shows roles immediately.** I asked for the seeded "Q3 planning notes" to be shared with Bob as Editor and Carol as Viewer, so a reviewer sees both roles without setting anything up.
- **UI polish with explicit constraints.** I asked for a design pass with one font, a small palette, icons with labels, toasts and keyboard-accessible controls, and no heavy UI framework, after the core features were done.

Deployment decisions I made myself: I declined Vercel's paid team plan (the brief says reviewers must not depend on paid services, and a trial could expire before review) and declined its suggested Prisma Postgres integration, because adding it would have created a second database and could have overwritten `DATABASE_URL`.

## AI decisions I checked

- **Pinned Prisma to the stable 7.10.1** instead of npm's `latest` tag, which pointed at an 8.0 release candidate.
- **Removed the extra Underline extension.** Tiptap 3's StarterKit already includes Underline, so adding `@tiptap/extension-underline` again would register it twice.
- **Disabled `cacheComponents`.** The Next.js template enables it, but every page here depends on the signed-in user's cookie, so there is nothing to prerender or cache, and it would force Suspense boundaries around every cookie read.
- **Same 404 for "not found" and "no access".** A stranger cannot tell whether a document exists. I accepted this.
- **Ownership checked before email lookup when sharing.** A non-owner cannot use the share form to probe which emails are registered.
- **1 MB content cap with a 2 MB file cap.** A 2 MB text file can exceed 1 MB once converted to editor JSON, which would have produced a document that can never be saved; import now refuses it with a clear message. I accepted this and listed it as a known limitation.
- **Used the local Next.js docs.** This Next.js version differs from what the model remembers (for example error boundaries receive `retry`, not `reset`); the template's `AGENTS.md` tells the agent to read `node_modules/next/dist/docs/` first.

## How I verified the work

- **Unit tests (Vitest, 122):** permissions (owner / editor / viewer / stranger for every function), import conversion (txt, markdown, a real `.docx` fixture, unsafe HTML, bad and corrupt files), share and role validation (self-share, duplicate, unknown user, non-owner, role changes, invalid roles), title numbering, and the Markdown export (headings, bold/italic, lists, underline handling, safe file names).
- **Tests that found real bugs in AI-written code:**
  - underlined text was silently lost on `.docx` import (mammoth ignores underline by default);
  - inline `<script>` in Markdown left its code behind as visible text;
  - exported Markdown lists contained empty indented lines;
  - a document titled `../../etc/passwd` produced a download file name starting with a dot.

  All were fixed, and the tests now check the exact output.
- **`curl` checks of status codes and permissions:** 200 / 401 / 403 / 404 / 400 / 413 / 415 for pages and the autosave, import and export endpoints, as owner, editor, viewer, stranger and signed-out. Also a production build run against an unreachable database to confirm no stack trace or connection detail reaches the browser.
- **Headless-browser checks by Claude Code** for flows that `curl` cannot reach (sharing panel, viewer mode, export, print layout).
- **A manual browser checklist per phase,** run by me in Chrome, locally and on the deployed site.
- Type check, lint and a production build before every commit.

**What I did not verify:** mobile and tablet layouts, and very large documents. Local development and production also share one Neon database. With more time I would add Playwright end-to-end tests across Chromium, Firefox and WebKit with mobile viewports, a test with a near-limit document to check editor performance and autosave, and a separate Neon branch for development.

## Things that went wrong along the way

- **Dark-mode contrast bug** from the Next.js template CSS (see above). No test caught it; I saw it.
- **Placeholder overlapping text** on the deployed site. Claude Code's first fix failed its own "delete everything, placeholder comes back" browser test (`showOnlyCurrent: false` read the editor's empty state one step late); the second fix passed.
- **README reviewer path broke after a seed change.** Once Q3 was pre-shared with Bob, the README step "share a document with Bob" would have hit "already has access". The AI caught this and pointed the step at a newly created document.
- A stale Turbopack module cache made the new import route return 500 until the dev server was restarted; the code was fine.
- The first dependency install failed on a peer-dependency conflict between Vitest and `@types/node` 20; resolved by moving to `@types/node` 24.

## Reflection

**What AI made faster.** Setup, boilerplate and tests. Scaffolding Next.js with Prisma 7, writing Zod schemas and server actions, and producing 122 focused tests took minutes per phase instead of hours. That left my time for the parts that need judgment: scope, the permission model, and testing the product as a user.

**Where it needed me.** Everything visual and experiential. The two most visible bugs (white-on-white text and the ghost placeholder) passed every automated check and were only found by using the app. The AI also does not decide scope on its own: left alone it would keep adding; the phase gates and the out-of-scope list kept the build focused.

**What I would not trust it with blindly.** Security-relevant defaults (auth, what an error message reveals, file handling), dependency versions, and "it works" claims about the UI. I treat the AI's report as a claim to verify, not a result.

**What I would do differently.** Set up a separate development database from the start, add one Playwright smoke test for the main flow early so UI regressions are caught automatically, and do a short design pass earlier instead of at the end.
