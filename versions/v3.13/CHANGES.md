# v3.13 — 13 Nov 2026

## Live check (before)
- No errors or slow pages. Ahri vs Syndra (50 games) still had no lane chart 45 minutes after v3.12.
- Cause: lane leads were counted only from timelines downloaded after v3.12. The collector skips games it already has, so the ~6,650 games collected earlier would never add to the charts, and popular matchups would take days to reach 5 games.

## Added
- **Lane curve backfill.** After each ladder player's new games, the collector re-reads up to 4 older games (newest first) and adds only their 5/10/15-minute gold and CS leads. A `laneDone` list (kept on disk) makes sure each game is counted once. On first start it marks the games collected since v3.12 as done. This uses the same pacing as the collector and only runs when visitors leave at least half of the API budget free. Popular matchups should get their charts within a few hours.
- **Link-preview images for shared drafts and comparisons.**
  - `/draft?role=MIDDLE&enemy=zed` → "Answers to Zed" with the enemy's splash and the top 4 answers with their win rates (`/og/draft/:role/:enemy.jpg`), using the draft page's own rules: enough games, and the matchup favours us.
  - `/compare?a=…&b=…` → both players side by side: icon, Riot ID, region, rank and LP (`/og/compare.jpg`). The page title names both players.
  - Previews in `demo/14-share-draft.jpg` and `demo/15-share-compare.jpg` (drawn without network, so icons are placeholders; the live server has the pictures).

## Privacy
- Link previews for a hidden player (profile or comparison) now get the plain site card, with no name or rank.

## Checks
- 57 tests pass (new "lane curve backfill" test: an old-format store is backfilled to exactly the same lane curves, and reading a game twice doesn't count it twice). Typecheck and build pass.

## Live check (after deploy)
- Deployed 13 Nov 2026 09:43 (deploy.log EXIT CODE 0).
- `/draft?role=MIDDLE&enemy=zed` has the title "Answers to Zed (Mid) · Draft helper" and its own preview image (`live/share-draft-zed.jpg`: Zed's splash with Ahri, Yasuo, Yone and Syndra).
- `/compare?a=…&b=…` names both players in the title and points to `/og/compare.jpg` (200, about 0.3 s).
- The backfill had just started, so the lane chart wasn't on Ahri vs Syndra yet; check again next iteration.
