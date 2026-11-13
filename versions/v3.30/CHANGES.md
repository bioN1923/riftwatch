# v3.30 — 13 Nov 2026

## Live check (before)
- v3.29 is live (user deployed 18:50): the special-mode game on `Annie IRL#Annie` no longer shows "CS 0 · 0.0/m".
- Considered "champions both players play" on Compare: it already exists (shared champions get a gold ring).
- Ladder on phone: clean, no horizontal scroll. But there's no way to find someone: Challenger is 300 players, and Master is thousands across many pages of 100.

## Added
- **Find a player on the ladder.** A search box ("Find a player (Name#TAG)") next to the region and queue pickers:
  - jumps to the page the player is on and highlights their row (gold outline, `aria-current`, scrolled into view);
  - otherwise says "{name} isn't in this {tier} ladder (or their name isn't known here yet)."
- The highlight clears when you switch region, queue or tier.
- Server: `GET /api/leaderboard/:platform/find?queue&tier&q`.
  - "Name#TAG" first matches names we already know; if that fails, it looks the account up once (cached 30 minutes) and matches by PUUID.
  - A bare name matches known names (exact first, then starts-with).
  - Hidden players are never found.
- The ladder fetch is now one helper (`ladderAll`) shared by the page and the search.
- Translated in all 7 languages.

## Checks
- 73 tests pass; typecheck, build and a11y check clean.
- Playwright (desktop and iPhone 13), demo Master ladder: "FrostSpark65#EUW" → `?tier=master&page=3&hl=107`, row 107 highlighted; "nobody#X" → the not-found message (`demo/find-*.png`).
