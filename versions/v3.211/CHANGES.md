# v3.211: an ARAM line for the collector, and a stricter "Best win rate"

## Why ARAM had only 269 games
- `crawler.ts`: for about 35% of the active apex players in each pass, the collector asked for that player's last 5 ARAM games (`readQueue(puuid, 450)`).
- Challenger, Grandmaster and Master players rarely play ARAM, so the request mostly came back empty: one call of the budget gone and no game read.
- Arena had the same problem and solved it in v3.x with a line. Every Arena game read lines up its other players (`ArenaSeeds`), because Arena players lead to more Arena players.

## What changed
- **`ArenaSeeds`:** takes an optional `accepts(queueId)` filter (default `isArena`). Otherwise unchanged: platform-only, each player once, bounded, and saved to disk at most once a minute.
- **`server/index.ts`:**
  - A second line, `aramSeeds` (`q === 450`, up to 300 queued), saved to `data/aram-seeds.json`.
  - It's fed by every match the server reads: a visitor's games, and the collector's own through `readQueue`.
  - It's flushed with the others on shutdown.
  - `/api/health` gains `aram.queued`.
- **Collector:** with the same 35% chance and the same 5-game cap, it asks `aramSeeds.take()` when someone is lined up, and falls back to the apex player as before. The request share is unchanged; the line just turns those calls into real ARAM games. Visitors still come first (the collector never takes the last half of the key's budget).
- **"Best win rate" tag** (`pickVariations`): needs `BEST_MIN_GAMES` (20) games, or 5% of the total if that's more (was 5). Live, ARAM Ahri (37 games) had rune pages of 12 games at 50%, 11 at 45% and 5 at 80%, and builds of 1–2 games, so the badge could go to a 4–1 sample.

## Tests (190 pass)
- An ARAM line takes only ARAM players, and the Arena line ignores ARAM games.
- No build or rune page tagged "best" has fewer than `BEST_MIN_GAMES`, in ranked or ARAM.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Demo `/api/health` has `aram`.
- Screenshots: `demo/`.
