# v3.97 — Keyboard shortcuts

**Why.** People who check stats often (between games, on a desktop next to the client) move faster with the keyboard. The site had only "/" for search, and nothing told anyone about it.

**What.**
- `src/components/Shortcuts.tsx`, mounted in the layout: "?" opens a list of shortcuts in a native `<dialog>` (focus is trapped and returned, Esc and a click outside close it); "g" then a letter within 1.5 s jumps to a page: h Home, c Champions, l Ladder, m Multi-search, p Compare, d Draft, u Duo. "/" (search) is listed too.
- Ignored while typing in a field and when Ctrl/Alt/⌘ is held, so browser and screen-reader keys keep working.
- Footer link "Keyboard shortcuts" on desktop opens the same list. Strings in seven languages.

**Checks.** tsc, 142 tests, build, a11y `{}`. Playwright: "?" opens the dialog, Esc closes it; g l → /leaderboard; g d → /draft; typing "gc" in the search box doesn't navigate; the footer link opens it. Shot `demo/shortcuts.png`.

## Live check (2026-11-15)
Deployed 17:42 (local). On riftwatch.fly.dev: "?" opens the shortcuts dialog; /changelog shows v3.97.

**Arena update:** the Arena tier list now has **13 matches** (66 champion rows, patch 16.22) — the first Arena data since v3.81. The current server instance's own probe found nobody yet (`probes 1, found 0`), so the games came from an earlier instance's probe or seed chain (v3.94/v3.96, saved stats survive restarts). The v3.93–3.94 work is paying off; the count should keep growing as seeds chain on.
