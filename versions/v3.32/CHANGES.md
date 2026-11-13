# v3.32 — 13 Nov 2026

## Live check (before)
- All 11 main pages answer in 34–50 ms. 8,140 ranked games on 16.22.
- `/multisearch` with nothing searched is a bare form. Players who scout the same friends or duo partners have to paste them in every time.

## Added
- **Recent lobbies on Multi-search.** The last 3 lobbies you scouted are kept in this browser (`rw:lobbies`), newest first. Each card shows the player count, region and names.
  - One click fills the box, switches region if needed, and scouts again.
  - "Clear" removes them.
  - The same players in a different order count as one lobby.
  - Shown only while nothing is being scouted, so it never pushes results down.
- Translated in all 7 languages, with correct plurals (Romanian and Polish included).

## Checks
- 75 tests pass (new: keeps 3, newest first, no duplicates in any order, ignores empty lobbies). Typecheck, build and a11y check clean.
- Playwright (desktop and iPhone 13): after two scouts, both lobbies show; clicking "Faker, Caps, Rekkles" re-runs it (`demo/lobby-*.png`).
