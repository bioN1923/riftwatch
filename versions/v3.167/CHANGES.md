# v3.167: matchup header colours follow the verdict

## What changed
- **Why (spotted on the phone matchup page):** Ahri vs Zed's verdict reads "Leaning Zed, could still be chance". Yet every number under it was red: "Compared with usual −2.8%", gold −74, CS −1 and XP −196. That's the colour of a clear loss, which contradicts the verdict right above it.
- **`Lead`** (`Champion.tsx`) takes `tone` to override the colour, and `quiet` so leads smaller than it stay plain. New thresholds: `GOLD_QUIET` 100, `CS_QUIET` 3, `XP_QUIET` 200.
  - **Matchup header:**
    - "Compared with usual" uses the verdict's `callTone` (faint under the low-sample line).
    - Gold, CS and XP at 15 use the quiet thresholds.
  - **Champion page matchups table:** gold, CS and XP columns use the same thresholds.
- **Why fixed thresholds for the leads:** there is no per-matchup spread for gold, CS or XP to test against, so these are plain "too small to matter" cut-offs. Players have roughly 7,000 XP by 15 minutes, so a 200 XP gap is about one wave.
- **Duplicate reminder:** two copies of the v3.167 reminder arrived (one 21 minutes late); the work was done once.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Phone matchup page: no horizontal scroll at 390 px.
- Screenshots: `demo/` and `demo/matchup-header.png` (all plain, matching "could still be chance").

## Live check (2026-11-16 14:34 local)
- The live index serves `index-Hfpz12wp.js`, and the 3.167 changelog entry is present.
- Ranked patch 16.22 is at 25,294 games, up from 25,137 at 14:03: still about 5 a minute.
