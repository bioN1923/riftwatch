# v3.85 — Lane opponents on the Stats tab

The per-champion panel already listed lane opponents for one champion. This adds the overall view other sites show: who you face in lane most, across everything you played.

## Change
- `src/lib/laneOpponents.ts` `laneOpponents(matches, puuid)`: the enemy in the same position in each game. Games without positions (ARAM, Arena) and remakes are skipped. Most met first; ties put the worse record first. 1 test.
- `StatsTab.tsx` `LaneOpponents`, under "Champions played": the top 8 as cards with icon, name, W–L and win rate.
  - Shown once at least 5 games have a lane opponent.
  - The win-rate colour follows the v3.82 rule (neutral under 5 games). With "Load more" it fills in.
- Strings `stats.oppTitle`, `stats.oppLead_*` in 7 languages.

## Search check (no change needed)
Typing a name without a tag offers champions and "Look up name#TAG" on the selected region, with a hint to add the tag.

## Checks
tsc clean · 123 tests pass · a11y `{}` · demo `lane-opponents.png` (Caps: 16 games; Vi 1–2, Nidalee 1–2, Kha'Zix 2–1 …).

## Live check (2026-11-14 17:13)
- Deploy finished cleanly at 17:12. bioN1923's Stats tab now shows "Lane opponents" from 20 games: Lillia 1–2, Shyvana 0–2, Jarvan IV 0–2, Rammus 0–2, Briar 1–1, Volibear, Warwick, Master Yi. All are neutral, as small samples. Screenshot: `live/lane-opponents.jpg`.
