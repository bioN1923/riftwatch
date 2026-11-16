# v3.196: cut-off scan on desktop and in German and Polish

## Scan
The v3.195 cut-off scan (elements with `text-overflow: ellipsis` whose text is actually cut, plus leaf text spilling past the viewport edge) was run on 17 pages in three setups:
- **1280 px, English:** only the match rows' compact team lists, where names are cut by design (70 px). The other players already had a `title` tooltip; the row's own player didn't, and now does.
- **390 px, German:** the live game row "Ambessa · 303.634 Meisterschaft". German compact number formatting has no short form for thousands, so the full number didn't fit.
- **390 px, Polish:** nothing ("303,6 tys." fits).

## What changed
- **`LiveGame` player row:** the champion line wraps (`leading-snug`) instead of truncating, and the mastery part is `whitespace-nowrap`, so it moves to the next line as one unit.
- **`MatchRow`:** the row's own player name in the team list gets `title="Name#TAG"`.
- **Matchup page, "Other <role> matchups":** chips with fewer than `TONE_MIN_GAMES` (5) games show only the game count, not a percentage. On the demo, "Ezreal 0% · 1 game" and "Lulu 100% · 1 game" read as verdicts even in grey.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/live-de-phone.png`, `demo/other-matchups-phone.png` and `demo/`.
