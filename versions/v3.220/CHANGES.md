# v3.220: Compare shows a record, not a percentage, under 5 games

## Found
- In Compare's "Most played" (`v3.219/demo/08-compare.jpg`), Lux 2 games, Vi 2 games and Lulu 1 game each read **100%** in bold, the same weight as Thresh's 71% over 7 games.
- "By role" showed "1 game · 100%" the same way.
- The colour was already honest (`sureTone` keeps it plain), but the number itself still read like a result.

## What changed
- **Most played** and **By role**: under `TONE_MIN_GAMES` (5), the win rate is replaced by the record, `{wins}W {losses}L`, in muted text. This uses the existing `common.wins`/`common.losses` keys, already translated.
- From 5 games up, nothing changes: a percentage, coloured only when it's clearly off 50%.
- This is the same rule the matchup "Other" chips (v3.196) and lane opponents (v3.197) already follow.

## Checks
- `tsc`, `vitest` (190) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`, compare page: "2W 1L", "1W 0L".

## Also: light-theme win colour (a11y)
- The a11y run flagged the light-theme day badge on profiles ("N wins to end the day", `bg-win-tint text-win`, 11 px) at a contrast of **4.35:1** (#107a56 on #deebe7).
- It appears only when the last day ends on a streak of 3 or more, which today's demo data does.
- The light `--win` is now **#0e7451**: 4.72:1 on the tint and 5.78:1 on white, up from 5.33:1. This is a barely visible darkening that applies to every light-theme green. Dark theme is unchanged.
- a11y re-run: `{}`.

## Live check (08:17 local)
- `3.220` is in the live JS bundle, and `#0e7451` is in the live CSS.
- Sync note: `rw-sync-449` was packed before the a11y fix, then superseded by the amended commit. It was copied but never extracted, and the PC got `rw-sync-450`.
