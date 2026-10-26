# Changelog

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
