# v3.35: "What's new" dot, and pages open at the top

## Changes
- **New-since-last-visit marks.** `rw:seen-version` (localStorage) stores the newest changelog version the visitor has seen.
  - A first visit counts as up to date: there's no dot on day one.
  - When a newer version ships, the footer "What's new" link gets a gold dot, with "(new updates)" for screen readers.
  - On `/changelog`, the entries newer than the last seen version get a "NEW" badge, and the page marks everything as seen.
  - `newerThan()` in `src/data/changelog.ts` compares versions numerically ("3.10" > "3.9"); a test covers it.
- **Bug fix: scroll position.** The app had no scroll restoration. A link clicked low on a page (the footer, say) opened the next page scrolled down.
  - Added `<ScrollRestoration>`, keyed by pathname with `/live` and `/stats` stripped, so profile tabs and filter changes don't jump to the top.
  - Back restores where you were. Checked: click → 0; Back → 2868 (the old position); Forward → 900.
- Strings `cl.new` and `cl.unseen` in all 7 languages.

## Checks
- 77 tests pass, typecheck clean, a11y `{}`.
- Demo screenshots in `demo/`, including `footer-dot-*` and `changelog-new-*`.
