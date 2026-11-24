# AI workflow

> **DRAFT for Derviş to edit.** Everything marked `TODO(Derviş)` must be confirmed or rewritten in your own words before submitting. The factual items below come from your instructions and the project history; the honest reflection is yours to write.

## Tools used

- **Claude Code (in VS Code):** implementation. It wrote the code, ran the type checker, linter, tests and builds, and ran `curl` checks against the dev server.
- **Claude (chat):** planning, writing the phase prompts, and reviewing each phase report before I tested it.

`TODO(Derviş): confirm the tools and versions/models you actually used, and whether anything else (e.g. Copilot, other chats) was involved.`

## How I worked

1. **Phased plan, agreed up front.** Phase 0 was a proposal only (folder structure, Prisma schema, phase plan). I approved it before any code was written. Then: setup/schema/seed/mock auth, dashboard, editor + autosave, file import, sharing, and a final quality + docs pass.
2. **Stop after every phase.** Each phase ended with a report: what was built, commands to run, a manual checklist, and decisions I should know about.
3. **I tested every phase in the browser before committing.** One commit per phase, plus separate commits for follow-up fixes. I did not let the AI commit ahead of my verification.
4. **Scope control.** The out-of-scope list was given to the AI at the start and repeated in the plan. The stretch item was held back until the six phases were done and verified, then built as a separate step: viewer/editor roles (Markdown export and print-to-PDF were added afterwards as a small extra). `TODO(Derviş): confirm this, and note why you chose roles over Markdown export.`

`TODO(Derviş): add roughly how long each phase took you (prompting + reviewing + testing) and the total.`

## Where I changed or corrected the AI's output

These were requests I made beyond, or against, what the AI first produced:

- **Permission tests moved to Phase 2.** The plan put tests at the end; I asked for the permission tests immediately, because the module is pure and cheap to test, and it would protect every later phase from regressions.
- **Title saved on Enter and on blur.** The first editor only saved the title through the Rename button, so typing a new title and clicking away silently lost it.
- **Light-theme fix.** The editor and header were unreadable (white text on white) on a machine in OS dark mode. I spotted it in the browser; the cause was the dark-mode CSS that ships with the Next.js template overriding the app's text colors. I asked for one consistent light theme.
- **Google Drive-style title numbering.** After importing the same sample file several times I noticed identical "sample" documents on the dashboard and asked for `sample`, `sample (2)`, `sample (3)`, only against the user's own documents, case-insensitive, reusing gaps, and without changing rename.

`TODO(Derviş): add any other corrections or redirections you made that are not listed here (UI feedback, wording, rejected suggestions). Be specific.`

## AI decisions I checked

- **Pinned Prisma to the stable 7.10.1** instead of npm's `latest` tag, which pointed at an 8.0 release candidate.
- **Removed the extra Underline extension.** Tiptap 3's StarterKit already includes Underline, so adding `@tiptap/extension-underline` again would register it twice.
- **Disabled `cacheComponents`.** The Next.js template enables it, but every page here depends on the signed-in user's cookie, so there is nothing to prerender or cache, and it would force Suspense boundaries around every cookie read.
- **Used the local Next.js docs.** This Next.js version differs from what the model remembers (for example error boundaries receive `retry`, not `reset`); the template's `AGENTS.md` tells the agent to read `node_modules/next/dist/docs/` first.

`TODO(Derviş): confirm you reviewed these yourself, and add any other AI decision you challenged or accepted after checking (for example the 404-for-strangers choice, doing import conversion on the server, or the 1 MB content cap).`

## How I verified the work

- **Unit tests (Vitest, 122):** permissions (owner / editor / viewer / stranger for every function), import conversion (txt, markdown, a real `.docx` fixture, unsafe HTML, bad and corrupt files), share and role validation (self-share, duplicate, unknown user, non-owner, role changes, invalid roles) title numbering, and the Markdown export (headings, bold/italic, lists, underline handling, safe file names).
- **Tests that found real bugs in AI-written code:** underlined text was silently lost on `.docx` import (mammoth ignores underline by default), and inline `<script>` in Markdown left its code behind as visible text. Both were fixed.
- **`curl` checks of status codes and permissions:** 200 / 401 / 404 / 400 / 413 / 415 for pages and the autosave and import endpoints, as owner, shared user, stranger and signed-out. Also a production build run against an unreachable database to confirm no stack trace or connection detail reaches the browser.
- **A manual browser checklist per phase,** run by me.
- Type check, lint and a production build before the final commit.

`TODO(Derviş): say plainly what you did NOT verify (for example: the deployed Vercel build, other browsers, large documents) and how you would test it with more time.`

## Things that went wrong along the way

Candidates, written from the project history. Keep only what matches your experience, and add your own:

- A stale Turbopack module cache made the new import route return 500 until the dev server was restarted; the code was fine.
- The first dependency install failed on a peer-dependency conflict between Vitest and `@types/node` 20; resolved by moving to `@types/node` 24.
- The first run of the import tests showed underlined text missing from the converted `.docx` and leftover code text from a Markdown `<script>`; both were fixed in the converter (see above).

`TODO(Derviş): write your honest reflection (a few sentences each): what AI made faster, where it needed correcting, what you would not trust it with, and what you would do differently next time.`
