# Riftwatch versions

Every iteration of the improvement loop gets a folder here with what changed, why, and
screenshots: `live/` (riftwatch.fly.dev, real data) and `demo/` (demo data, full page).

| Version | Date | Highlights |
|---|---|---|
| [v3.28](v3.28/CHANGES.md) | 13 Nov 2026 | Match details link to the lane matchup page ("was it the matchup or the game?") |
| [v3.27](v3.27/CHANGES.md) | 13 Nov 2026 | Profiles: "Try next" suggests strong unplayed champions that fit the player's role and style |
| [v3.26](v3.26/CHANGES.md) | 13 Nov 2026 | Tier list: stars and a "My pool" filter for the champions saved in the draft helper |
| [v3.25](v3.25/CHANGES.md) | 13 Nov 2026 | Public "What's new" page (/changelog) with a player-facing entry per version |
| [v3.24](v3.24/CHANGES.md) | 13 Nov 2026 | Search dropdown: champion names no longer cut off (class under the name; icon-only badge on phones) |
| [v3.23](v3.23/CHANGES.md) | 13 Nov 2026 | Champion search understands nicknames (mf, tf, j4, asol, lb, ww…) everywhere |
| [v3.22](v3.22/CHANGES.md) | 13 Nov 2026 | Collector: only players with new games, Master tier added: more fresh games per API call |
| [v3.21](v3.21/CHANGES.md) | 13 Nov 2026 | Respects "reduce motion": no animations for visitors who ask their system for less motion |
| [v3.20](v3.20/CHANGES.md) | 13 Nov 2026 | Phone match cards wrap cleanly; Tools menu keyboard focus; patch movers skip changes within sampling noise |
| [v3.19](v3.19/CHANGES.md) | 13 Nov 2026 | Tier list: small hot samples no longer reach S+ (cautious score) |
| [v3.18](v3.18/CHANGES.md) | 13 Nov 2026 | Draft helper: safe blind picks (champions with the mildest worst matchups) before the enemy is known |
| [v3.17](v3.17/CHANGES.md) | 13 Nov 2026 | Live game: the player's guessed lane opponent and how that matchup goes in ranked |
| [v3.16](v3.16/CHANGES.md) | 13 Nov 2026 | Draft helper: "Ban for your pool", the enemy laners your champions do worst against |
| [v3.15](v3.15/CHANGES.md) | 13 Nov 2026 | Phone navigation with icons and a Tools menu (multi-search, draft, compare); matchup lane charts wait for 10 games |
| [v3.14](v3.14/CHANGES.md) | 13 Nov 2026 | Champion pages: lane curve over all opponents and a short-or-long-games verdict; sample note on matchup lane charts |
| [v3.13](v3.13/CHANGES.md) | 13 Nov 2026 | Lane curves backfilled from older games; link-preview images for shared drafts and comparisons |
| [v3.12](v3.12/CHANGES.md) | 13 Nov 2026 | Matchup lane curve (gold and CS lead at 5/10/15); tab rows no longer show a stray scroll control |
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

## Every iteration also
- Add a short, player-facing entry to `src/data/changelog.ts` (a test fails if its newest entry doesn't match `package.json`).

## Backlog (ideas, roughly by value)
- **More data** once the production key arrives: lower-elo tier lists (Emerald+, Diamond+).
- **Installable app (PWA)** — after the production key, as agreed.
