# Riftwatch (lol-stats v3)

A League of Legends player lookup in the spirit of u.gg and op.gg: rank, match history with full scoreboards, recent champion stats, duo partners, mastery and live games, for every region.

## Quick start

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev               # API on :3001, web app on http://localhost:5173
```

With no `RIOT_API_KEY` in `.env` the app runs in **demo mode**: any Riot ID shows a generated (but consistent) profile, so you can work on the UI without a key. Search `notfound#demo` to see the not-found state.

For real data, get a key at <https://developer.riotgames.com>, put it in `.env` as `RIOT_API_KEY=RGAPI-…` and restart. Development keys expire every 24 hours; the app tells you when that happens. To run the site publicly you need a Personal or Production key from Riot.

| Script | What it does |
| --- | --- |
| `npm run dev` | API + Vite dev server with hot reload |
| `npm run demo` | Same, forced into demo data |
| `npm run build` | Type-check and build the web app into `dist/` |
| `npm start` | Serve the API **and** the built app from one port (3001) |
| `npm run typecheck` | Type-check only |

## What changed from v2

- **The API key no longer reaches the browser.** v2 used `VITE_RIOT_API_KEY`, which Vite bundles into the public JavaScript. The key is now server-only.
- **Current Riot endpoints.** Riot removed summoner IDs; everything now uses PUUIDs (`league-v4/by-puuid`, `champion-mastery-v4/by-puuid`, `spectator-v5`).
- **All 15 regions** with correct platform / regional routing, instead of hardcoded EUNE.
- **Rate limiting and caching.** Requests queue to stay under your key's limits (20/s, 100/2 min by default, configurable), retry once on 429, and finished matches are cached for a day.
- **Match history is finished**: items, runes, spells, KDA, kill share, CS/min, vision, multikills, MVP/ACE and a 0–10 performance score, plus an expandable scoreboard for both teams with damage, gold and objectives.
- **Its own look** ("Hextech ink"): splash-art match cards grouped by day, a header with ranks and a champion form ribbon, and a written scouting report alongside champion pool, frequent teammates and mastery.
- **Live game tab** with both teams, runes, spells and bans; refreshes every minute.
- **UX**: keyboard-friendly search with recent and favorite players (press `/` anywhere), region remembered, shareable URLs (`/lol/euw1/Name-TAG?queue=solo`), skeleton loading, clear error messages (not found / wrong region / expired key / rate limited), light and dark themes, responsive down to phone width, visible focus, reduced-motion support.
- **Always-current game assets** from Data Dragon's latest patch instead of a hardcoded 13.x version.

## Game details

Every game expands into five tabs:

- **Post game**: both scoreboards with damage dealt and taken, gold, CS, wards and items, plus team kills, gold and objectives.
- **Performance**: head-to-head against the lane opponent (or the lobby average in ARAM) across 17 metrics, each with its rank in the game, plus the categories this player led.
- **Item build**: shop visits in order with timestamps (sold items crossed out), skill order and max order, and the full rune page. You can switch to any of the 10 players.
- **Timeline**: blue-side gold lead minute by minute with objectives and towers marked, a minimap of the player's kills, assists and deaths, and an event log.
- **Metrics**: gold, CS, experience or damage over time against the lane opponent and the lobby average, lane leads at 10/15/20 minutes, and a table view.

Timelines come from Riot's match timeline endpoint and load only when you open one of those tabs.

## Champions

`/champions` is a tier list (by role, Ranked or ARAM, per patch, sortable) and each champion has a page with tier, win/pick/ban rates, abilities, the recommended build (rune pages, spells, starting items, core builds, boots, 4th–6th item options, skill order), matchups with gold leads at 15 minutes, win rate by game length, average stats, base stats and lore.

Riot has no API for champion statistics, so like u.gg and op.gg the server builds them itself from games it reads:

- every ranked or ARAM match it loads for a profile, plus timelines you open;
- a **background collector** that walks the Challenger and Grandmaster ladders and reads their recent ranked games with timelines. It makes one request every 2.5 seconds (well under a development key's limit) and pauses while anyone is using the site.

With a development key that is roughly 700 matches an hour, so the tier list is usable after an hour or two and solid after a day. Stats are saved in `server/data/champions.json` and survive restarts; the four most recent patches are kept. Settings in `.env`: `CRAWLER`, `CRAWL_REGION`, `CRAWL_PACE_MS`.

## Search autocomplete

Riot has no "search players by name" endpoint, so (like op.gg) suggestions come from players the server has already seen: every profile, match and live game it loads adds those players to an index saved in `server/data/players.json`. It grows the more you use it. When you type a full Riot ID (`Name#TAG`), the server also checks Riot directly so brand-new players show up, marked with a check.

## Project layout

```
server/        Express API (TypeScript, run with tsx)
  index.ts       routes: /api/profile, /api/matches, /api/timeline, /api/search, /api/live, /api/champions, /api/health
  riot.ts        Riot client: routing, cache, rate limiter, error mapping
  shape.ts       trims Riot payloads (matches, timelines) into compact types + performance score
  playerIndex.ts players seen so far, for autocomplete (saved to server/data/)
  champStats.ts  champion statistics aggregated from matches (saved to server/data/)
  crawler.ts     background collector of high-elo ranked matches
  items.ts       item classification (legendary / boots / starter) from Data Dragon
  mock.ts        demo-mode data generator (profiles, matches, timelines)
shared/        types and region table used by both sides
src/           React 19 + TanStack Query + React Router + Tailwind v4
  pages/         Home, Profile (overview + live), Champions (tier list), Champion, NotFound
  components/    SearchBox, profile/*, match/* (card + details tabs), champions/*, build/*, charts/*, ui/*
  lib/           api client, Data Dragon, formatting, stats, storage
public/ranks/  rank emblems (from the original lol-stats project)
```

Riftwatch isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties.
