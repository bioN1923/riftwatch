# Riftwatch (lol-stats v3)

A League of Legends stats site in the spirit of u.gg, op.gg and Porofessor, with its own look: player profiles with minute-by-minute game breakdowns, champion builds and tier lists, live-game scouting, multi-search, ladders and rank history, for every region.

## Quick start

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev               # API on :3001, site on http://localhost:5173
```

Without a `RIOT_API_KEY` in `.env` the app runs in **demo mode**: any Riot ID shows a generated (but consistent) profile, and champion stats come from a few thousand generated games, so everything can be explored without a key. Search `notfound#demo` to see the not-found state.

For real data, get a key at <https://developer.riotgames.com>, put it in `.env` as `RIOT_API_KEY=RGAPI-…` and restart. Development keys expire every 24 hours; the site tells you when that happens. The server reads your key's real rate limits from Riot's responses, so a Personal or Production key is used at full speed automatically.

| Script | What it does |
| --- | --- |
| `npm run dev` | API + Vite dev server with hot reload |
| `npm run demo` | Same, forced into demo data |
| `npm test` | Unit tests (Vitest) |
| `npm run build` | Type-check and build the site into `dist/` |
| `npm start` | Serve the API **and** the built site from one port (3001), with link previews |
| `docker build -t riftwatch . && docker run -p 3001:3001 --env-file .env -v riftwatch-data:/app/server/data riftwatch` | Run it as a container |

## Features

### Players
- **Search with autocomplete** from every player the server has seen, plus a live check when you type a full `Name#TAG`. Press `/` anywhere to search. Recent and starred players are remembered.
- **Profile**: ranks, a strip of the last 20 games as champion portraits, quick-read tags (win/loss streaks, one-tricks, role mains, high KDA, possible smurf, often MVP…), a written scouting report, champion pool, frequent teammates, mastery and **rank history** (LP chart). Starred players are tracked: the server checks their rank every 20 minutes so the chart fills in by itself.
- **Match history** grouped by day, with queue filters and auto-loading. Every game expands into five tabs:
  - **Post game** – both scoreboards, team gold/kills/objectives
  - **Performance** – head-to-head with the lane opponent across 17 metrics, each ranked within the game
  - **Item build** – shop visits with timestamps, skill order, full rune page; switch to any of the ten players
  - **Timeline** – gold lead chart with objectives, minimap of kills/deaths, event log
  - **Metrics** – gold, CS, XP or damage per minute vs the opponent and lobby average, lane leads at 10/15/20
- **Stats tab**: sortable per-champion table (KDA, CS/min, damage, gold, kill share, vision…), per-role summary, an activity calendar, and trend charts with a 5-game rolling average.
- **Live game**: every player's rank, win rate, mastery on their champion, warning tags ("new on this champion", "hot streak"…) and **premade detection** (players who shared recent games), plus team average rank.

### Tools
- **Multi-search** – paste the champion-select chat ("… joined the lobby") and scout all teammates at once: rank, last 10 ranked results, best champions and tags. The URL is shareable.
- **Ladder** – Challenger, Grandmaster and Master for any region and queue.
- **Server status** – Riot's incident and maintenance notices appear as a banner.

### Champions
- **Tier list** by role, Ranked or ARAM, per patch, sortable, with this week's free rotation.
- **Champion pages**: tier and win/pick/ban rates, abilities, recommended build (rune pages, spells, starting items, core builds, boots, 4th–6th items, skill order), matchups with gold leads at 15 minutes, best duo partners, win rate by game length, the players who play it most, average stats, base stats and lore.

Riot publishes no champion statistics, so like u.gg and op.gg the server builds them from games it reads: everything loaded for profiles, plus a **background collector** that walks the Challenger and Grandmaster ladders. It makes one request every 2.5 s and pauses while anyone is browsing — roughly 700 games an hour on a development key. Stats survive restarts; the four latest patches are kept. Settings: `CRAWLER`, `CRAWL_REGION`, `CRAWL_PACE_MS` in `.env`.

### Quality
- Riot API key stays on the server; adaptive rate limiting with retry on 429; responses cached; gzip.
- Lazy-loaded pages (first download ~80 kB gzipped), skeleton loading, clear error messages, an error page instead of a blank screen.
- Light/dark/system themes, responsive down to phone width (bottom navigation), keyboard accessible, reduced-motion support, WCAG AA contrast, zero axe-core violations on every page.
- Link previews (title and description) for shared profile and champion links when served by `npm start`.

## Data files

`server/data/` (git-ignored) holds what the server learns over time:

| File | Contents |
| --- | --- |
| `players.json` | Players seen, for autocomplete and ladder names |
| `champions.json` | Champion statistics by patch |
| `lp.json` | Rank history and tracked players |

Delete a file to reset it.

## Project layout

```
server/        Express API (TypeScript, run with tsx)
  index.ts       routes: profile, matches, timeline, live, scout, search, lp/track,
                 champions, leaderboard, rotation, status, health; static site + link previews
  riot.ts        Riot client: routing, cache, adaptive rate limiter, error mapping
  shape.ts       trims Riot payloads (matches, timelines, live) + performance score
  champStats.ts  champion statistics aggregated from matches
  crawler.ts     background collector of high-elo ranked matches
  playerIndex.ts players seen, for autocomplete and names
  lpStore.ts     rank history and tracked players
  items.ts       item classification (legendary / boots / starter) from Data Dragon
  mock.ts        demo-mode data (profiles, matches, timelines, ladders, live games)
shared/        types and region table used by both sides
src/           React 19 + TanStack Query + React Router 7 + Tailwind 4
  pages/         Home, Profile (overview, stats, live), Champions, Champion, Leaderboard, MultiSearch
  components/    match/* (card + detail tabs), profile/*, champions/*, build/*, charts/*, ui/*
  lib/           api client, Data Dragon, formatting, stats, tags, ladder maths, storage
tests/         Vitest unit tests
```

Riftwatch isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties.
"# riftwatch" 
