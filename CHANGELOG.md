# Changelog

## 3.5 — Riot application readiness

### New
- **Hide my profile** (`/privacy`): players prove ownership by equipping a starter icon (checked via summoner-v4). Hidden players can't be opened, are anonymised in other players' games, live games, the ladder and search, and their stored data is deleted. Reversible the same way.
- **Privacy policy** (`/privacy`) and **How we use the Riot API** (`/api-usage`) pages, linked in the footer.
- **Finished matches are stored on disk** (`server/data/matches`, up to `MATCH_STORE_MAX`), so restarts and deploys never re-download them.

### Improved
- **Rate limits**: per-region and per-endpoint queues from Riot's `X-App-Rate-Limit` and `X-Method-Rate-Limit`; a 429's `Retry-After` pauses the whole queue; exponential backoff with jitter when there's no `Retry-After`, and for 5xx and network errors.

## 3.4

### New
- **Compare players** (`/compare`): two players side by side, even from different regions: rank, recent form, 12 per-game stats, roles, most-played champions and games played together. A Compare button on every profile starts one.
- **Arena builds**: Arena on the tier list and champion pages, with average place, top-4 and first-place rates, the best augments (by rarity, with descriptions in every language), finishing-place chart and best duo partners. The collector now also reads ARAM and Arena games.
- **Search engines**: translated page titles and descriptions in all seven languages, `?lang=` links with hreflang and canonical tags, `/sitemap.xml` (every champion and popular matchup) and `/robots.txt`. Kept out of search engines while the site password is on.
- **Error alerts**: server, Riot and browser errors are grouped at `/admin/errors` (set `ADMIN_TOKEN`), and new problems or an expired Riot key are posted to a Discord/Slack webhook (`ALERT_WEBHOOK_URL`).

## 3.2 — overnight update

### New
- **Stats tab** on profiles: per-champion and per-role tables, activity calendar, trend charts.
- **Player tags**: streaks, one-tricks, role mains, high KDA, possible smurf and more, on profiles, multi-search and live games.
- **Rank history**: LP chart on profiles; starred players are tracked automatically.
- **Live game scouting**: rank, win rate, mastery, tags and premade detection for all ten players.
- **Multi-search**: paste champion-select chat to scout the whole lobby.
- **Ladder**: Challenger/Grandmaster/Master per region and queue.
- **Champion pages**: best duo partners and "who plays it most".
- **Free rotation** on the tier list; **server status** banner; **link previews** for shared links.
- Match history loads more games as you scroll.
- Dockerfile.

### Improved
- The server adopts your API key's real rate limits automatically (faster with Personal/Production keys).
- League lookups fall back to the older endpoint if needed; item stats ignore mode-specific items.
- First page load is ~40% smaller (pages load on demand); responses are gzipped; assets cached long-term.
- Accessibility: WCAG AA contrast in both themes, ARIA fixes, zero axe-core violations.
- An error page replaces blank screens if something breaks.
- 19 unit tests (`npm test`).

## 3.1
- Champions section (tier list, champion pages with builds, runes, skill order, matchups), background match collector.
- Game details tabs: post game, performance, item build, timeline, metrics.
- Autocomplete, new visual identity, pointer cursors, animations.

## 3.0
- Rebuild of lol-stats v2: server-side API key, current Riot endpoints, all regions, rate limiting, caching, full match history, live games, demo mode.
