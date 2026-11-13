# v3.25 — 13 Nov 2026

## Live check (before), through Claude in Chrome (the link to the PC was down)
- **Collection rate holds:** 6,825 ranked games at 12:30 UTC → 7,580 at 15:11 UTC, **about 280/hour** sustained (about 17/hour before v3.22).
- Home page performance: first byte 38 ms, largest paint 0.45 s, 217 KB over 43 requests. Nothing to fix.
- The ideas backlog only had production-key items left. Checked which common stat-site features exist: match gold-lead graph, skill order, vision and objectives are all there.

## Added
- **"What's new" page** (`/changelog`, linked in the footer): what changed for players, newest first, in plain words (English, with the usual note in other languages). The page title is translated into all 7 languages. It's in the sitemap and has its own title and description for link previews.
- It shows players, and Riot's reviewers, that the site is actively looked after.
- Entries live in `src/data/changelog.ts`. A test fails if the newest entry doesn't match the version in `package.json`, so the page can't fall behind. The per-iteration process in `versions/README.md` now includes this step.

## Checks
- 70 tests pass; typecheck, build and a11y check clean. Demo: `demo/cl-dark.png`, `demo/cl-phone.png`.

## Deploy
- The link to the PC is still down. v3.24 and v3.25 go out together, deployed by the user from `rw-sync-55.tar.gz` / `rw-gitd-55.tar.gz`.
