# v3.104 — Matchup across patches, wider accessibility check

**What.**
- Server: `MatchupStats.history` — this matchup in the chosen role on each kept patch (games, win rate), oldest first.
- `src/components/champions/PatchHistory.tsx`: the v3.101 panel moved out of the champion page and made generic (pick-rate column only when there is one). The matchup page shows it when there are two or more patches; same verdict rules (2 SE, 20+ games per patch, faded rows under 20).
- `scripts/a11y-check.cjs` now also covers the Arena tier list, a matchup page, Multi-search, Duo, the live game, the changelog, API usage, the Draft team section and the keyboard-shortcuts dialog (open), dark and light: no WCAG 2 A/AA violations.
- One new string (table caption without pick rate), seven languages; matchup history test (147 tests).

**Checks.** tsc, tests, build, a11y `{}` on 18 page states × 2 themes. Demo Ahri vs Zed mid: 62.7% (51) → 55.6% (36) → "No clear change since 15.19." (needs 20+ games both sides and a gap past 2 SE ≈ 21 points here). Shots `demo/patch-history-*.png`.

## Live check (2026-11-15)
Deployed 18:47 (local). API only: Ahri vs Zed mid history 16.20 40.0% (10, faded) → 16.21 51.5% (33) → 16.22 59.8% (102); the +8.3-point change is within 2 SE (≈20 points on those games), so the page says "No clear change since 16.21." Ladder LP change: not yet (first snapshot 16:36 UTC, needs to be an hour old). Arena unchanged (13).
