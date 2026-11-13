# Riftwatch versions

Every iteration of the improvement loop gets a folder here with what changed, why, and
screenshots: `live/` (riftwatch.fly.dev, real data) and `demo/` (demo data, full page).

| Version | Date | Highlights |
|---|---|---|
| [v3.11](v3.11/CHANGES.md) | 13 Nov 2026 | Compared with high elo (Stats tab); Today panel on profiles |
| [v3.10](v3.10/CHANGES.md) | 13 Nov 2026 | Tools row on home; small-sample flags in draft; WCAG check passes with zero issues |
| [v3.9](v3.9/CHANGES.md) | 13 Nov 2026 | Draft helper: best answers and your own pool vs the enemy laner; compact movers on phones |
| [v3.8](v3.8/CHANGES.md) | 13 Nov 2026 | Patch watch and Goals on profiles; tier list shows change since last patch; header and wording fixes |
| [v3.7](v3.7/CHANGES.md) | 13 Nov 2026 | Visitors' lookups before background work; ladder names in background; tier list, movers and counters need real samples |
| [v3.6](v3.6/NOTES.md) | 7 Nov 2026 | Baseline: Riot policy review, patch movers (live before the loop started) |

## How each iteration works
1. Use the live site with real data (desktop app browser) and note what's wrong or missing.
2. Look at what other stats sites do; add what's missing and ideas none of them have.
3. Build, test (`npm test`), check pages in demo mode, run `scripts/a11y-check.cjs`.
4. Take demo screenshots (`scripts/shoot-version.cjs versions/vX/demo`), write `CHANGES.md`.
5. Commit, deploy (`deploy.bat` → `deploy.log`), check the live site, save `live/` screenshots.

## Backlog (ideas, roughly by value)
- **Shareable draft and compare images** (link previews for /draft and /compare).
- **Matchup page: "how the lane goes"** — gold/CS/XP lead curve at 5/10/15 from timelines.
- **More data** once the production key arrives: lower-elo tier lists (Emerald+, Diamond+).
- **Installable app (PWA)** — after the production key, as agreed.
