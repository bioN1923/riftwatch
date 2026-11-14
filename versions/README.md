# Riftwatch versions

Every iteration of the improvement loop gets a folder here with what changed, why, and
screenshots: `live/` (riftwatch.fly.dev, real data) and `demo/` (demo data, full page).

| Version | Date | Highlights |
|---|---|---|
| [v3.86](v3.86/CHANGES.md) | 2026-11-14 | Ladder: find a player across all apex tiers |
| [v3.85](v3.85/CHANGES.md) | 2026-11-14 | Stats tab: lane opponents across all champions |
| [v3.84](v3.84/CHANGES.md) | 2026-11-14 | Arena tier list empty state explains its source |
| [v3.83](v3.83/CHANGES.md) | 2026-11-14 | Arena games sourced from Arena players instead of apex ranked players |
| [v3.82](v3.82/CHANGES.md) | 2026-11-14 | Profiles: no win-rate colour under 5 games |
| [v3.81](v3.81/CHANGES.md) | 2026-11-14 | Arena: follow Riot's new queue id 1710 (Arena stats were empty) |
| [v3.80](v3.80/CHANGES.md) | 2026-11-14 | Tier list: small samples after the rest when sorting by a rate |
| [v3.79](v3.79/CHANGES.md) | 2026-11-14 | Phones: Champions played table fits |
| [v3.78](v3.78/CHANGES.md) | 2026-11-14 | Phones: tier list and ladder tables fit the screen |
| [v3.77](v3.77/CHANGES.md) | 2026-11-14 | Phones: scoreboard items and CS under each player |
| [v3.76](v3.76/CHANGES.md) | 2026-11-14 | Phones: recent games strip as two rows of ten |
| [v3.75](v3.75/CHANGES.md) | 2026-11-14 | Draft: ban suggestions show games and clear vs leaning |
| [v3.74](v3.74/CHANGES.md) | 2026-11-14 | Lobby summary: open roles only for 4+ players; Duo on the home page |
| [v3.73](v3.73/CHANGES.md) | 2026-11-14 | Multi-search: lobby summary (average rank, mains, role clashes) |
| [v3.72](v3.72/CHANGES.md) | 2026-11-14 | Ladder: LP of the tier above and who has it; damage mix polish |
| [v3.71](v3.71/CHANGES.md) | 2026-11-14 | Static game data URL carries the release, so deploys skip stale browser caches |
| [v3.70](v3.70/CHANGES.md) | 2026-11-14 | Live game: team damage mix (AD/AP) |
| [v3.69](v3.69/CHANGES.md) | 2026-11-14 | Compare: no role-dependent winners against multi-role players |
| [v3.68](v3.68/CHANGES.md) | 2026-11-14 | Compare: gold only for edges beyond game-to-game noise |
| [v3.67](v3.67/CHANGES.md) | 2026-11-14 | Win conditions: make it a goal |
| [v3.66](v3.66/CHANGES.md) | 2026-11-14 | Stats tab: what your wins have in common |
| [v3.65](v3.65/CHANGES.md) | 2026-11-14 | Profile day headers: time played and end-of-day streak |
| [v3.64](v3.64/CHANGES.md) | 2026-11-14 | Deciding fight on the map: all its kills and follow-up objectives |
| [v3.63](v3.63/CHANGES.md) | 2026-11-14 | Turning points: first blood and deciding fight open the map popup |
| [v3.62](v3.62/CHANGES.md) | 2026-11-14 | Timeline map: events in a popup on the clicked dot |
| [v3.61](v3.61/CHANGES.md) | 2026-11-14 | Turning points: first blood, biggest swing, deciding fight, comeback/lead |
| [v3.60](v3.60/CHANGES.md) | 2026-11-14 | Timeline: tapping a list row on phones scrolls the map back into view |
| [v3.59](v3.59/CHANGES.md) | 2026-11-14 | Timeline list rows link to the map; duo checks removable and kept per tab |
| [v3.58](v3.58/CHANGES.md) | 2026-11-14 | Duo finder: check a specific player, check more co-players, apex rank labels |
| [v3.57](v3.57/CHANGES.md) | 14 Nov 2026 | Duo finder (user request): candidates from your recent ranked games, other roles, within ~1 tier; 7-part transparent fit score |
| [v3.56](v3.56/CHANGES.md) | 14 Nov 2026 | Clickable timeline map (user request): event details near a dot (kills+assists, objectives with killer, multi-kills), Everyone/This player, objective markers, ARAM map |
| [v3.55](v3.55/CHANGES.md) | 14 Nov 2026 | Tall sticky sidebars stick by their bottom (useStickyTop): bottom reachable mid-page (user request) |
| [v3.54](v3.54/CHANGES.md) | 14 Nov 2026 | Counters split into clear (beyond ~1 SE) vs leaning: champion strip dashed/faint for leaning, tier list "Weak against" red ring only for clear ones |
| [v3.53](v3.53/CHANGES.md) | 14 Nov 2026 | Tier list "Recently viewed" champions row (last 8, with role, browser-only, Clear) |
| [v3.52](v3.52/CHANGES.md) | 14 Nov 2026 | Keyboard pass (8 pages): 2px gold focus ring on all text inputs and the header search; ladder hidden submit no longer a Tab stop; Escape verified on menus/suggestions |
| [v3.51](v3.51/CHANGES.md) | 14 Nov 2026 | Phone sweep (15 pages, iPhone SE): no overflow; tap targets raised to 24 px (WCAG 2.2 2.5.8): sort headers, queue filter, trend chips, draft remove |
| [v3.50](v3.50/CHANGES.md) | 14 Nov 2026 | Compact phone profile header: 60px icon, buttons in one row (icon-only Copy/Compare), first match ~100px higher on iPhone SE |
| [v3.49](v3.49/CHANGES.md) | 14 Nov 2026 | Phone polish: profile rank blocks side by side; champion stat strip as a 3-column grid (fixes stray divider on wrap) |
| [v3.48](v3.48/CHANGES.md) | 13 Nov 2026 | Status banner follows the page's server (profile path / ladder & multi-search ?region) and names it |
| [v3.47](v3.47/CHANGES.md) | 13 Nov 2026 | Performance: slim Data Dragon bundle served from /api/static/:locale (889 kB raw / 143 kB gz → 496 kB / 89 kB, 5 requests → 1), with Data Dragon fallback |
| [v3.46](v3.46/CHANGES.md) | 13 Nov 2026 | Draft answers: 95% likely range under each win rate, green/red only when the range clears 50%, ranked by cautious rate |
| [v3.45](v3.45/CHANGES.md) | 13 Nov 2026 | Ladder: players in tier + lowest LP right now (Challenger/GM); API-usage page explains premade tags; no premades in live game (policy) |
| [v3.44](v3.44/CHANGES.md) | 13 Nov 2026 | Multi-search premade detection: "Premade with X" when two lobby players shared a team in 2+ recent ranked games |
| [v3.43](v3.43/CHANGES.md) | 13 Nov 2026 | Compare: role-aware scoring (different main roles → only win rate/KDA scored, with a note); live familiarity tags off in random-champion modes |
| [v3.42](v3.42/CHANGES.md) | 13 Nov 2026 | Live game player tags (Porofessor-style): first time / new to champion, Veteran, Just promoted; scout API tells "never played" from "unknown" |
| [v3.41](v3.41/CHANGES.md) | 13 Nov 2026 | Match rows: "x ago" is a <time> with the exact end day and time on hover |
| [v3.40](v3.40/CHANGES.md) | 13 Nov 2026 | Search region defaults to the last-viewed player's server until picked; favourites no longer repeated under Recently viewed |
| [v3.39](v3.39/CHANGES.md) | 13 Nov 2026 | Patch deltas on the tier list and Patch watch: green/red only beyond 2 SE, grey (with a tooltip) within normal swing |
| [v3.38](v3.38/CHANGES.md) | 13 Nov 2026 | Patch movers: 2-SE filter, ranked by the change we can be sure of (Δ − 1 SE), games on both patches shown |
| [v3.37](v3.37/CHANGES.md) | 13 Nov 2026 | Server side of v3.36: real 404 + "not found" titles for unknown champion/matchup addresses, 302 redirect for nicknames; champSearch moved to shared/ |
| [v3.36](v3.36/CHANGES.md) | 13 Nov 2026 | Champion and matchup addresses forgive nicknames and typos (redirect when sure, "Did you mean" otherwise) |
| [v3.35](v3.35/CHANGES.md) | 13 Nov 2026 | "What's new" dot + NEW badges since your last visit; pages open at the top (scroll restoration) |
| [v3.34](v3.34/CHANGES.md) | 13 Nov 2026 | Phone header: wider search box (language button shows just the code; tighter gaps) |
| [v3.33](v3.33/CHANGES.md) | 13 Nov 2026 | Multi-search and compare links encode Riot IDs once (old double-encoded links still work) |
| [v3.32](v3.32/CHANGES.md) | 13 Nov 2026 | Multi-search: recent lobbies (last 3, one click to scout again) |
| [v3.31](v3.31/CHANGES.md) | 13 Nov 2026 | Home: favourites refresh their rank and icon on every visit (matched Recently viewed) |
| [v3.30](v3.30/CHANGES.md) | 13 Nov 2026 | Ladder: find a player by Riot ID (jumps to their page and highlights the row) |
| [v3.29](v3.29/CHANGES.md) | 13 Nov 2026 | Match history: Spellbook and Swarm named; no zero CS/vision in modes without minions or wards |
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

## Deploying (since v3.31)
- The user runs `watch-deploy.bat` once (window left open). To deploy, create `deploy.request` in the project folder on the PC (device shell: `echo vX.Y > $HOME/mnt/CascadeProjects/lol-stats-v3/deploy.request`). Within 10 s the helper deletes it and runs `deploy.bat`; wait for a new "Deploy finished … EXIT CODE 0" in `deploy.log`.
- If `deploy.request` is still there after a minute, the helper isn't running: ask the user to start `watch-deploy.bat`.

## Every iteration also
- Add a short, player-facing entry to `src/data/changelog.ts` (a test fails if its newest entry doesn't match `package.json`).

## Backlog (ideas, roughly by value)
- **More data** once the production key arrives: lower-elo tier lists (Emerald+, Diamond+).
- **Installable app (PWA)** — after the production key, as agreed.
