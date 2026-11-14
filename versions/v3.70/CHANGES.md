# v3.70 — Live game: team damage mix

An idea from Porofessor-style live tools: knowing whether the enemy team is mostly physical or magic damage tells you which resist to build.

## Change
- `shared/staticSlim.ts`: champions keep Riot's `info.attack` / `info.magic` ratings (`dmg: [attack, magic]`) from Data Dragon's champion list. The field is optional, so an older cached copy just hides the line.
- `src/lib/damageMix.ts`:
  - `damageType()`: AD when attack is ≥ 60% of attack + magic, AP when ≤ 40%, otherwise mixed.
  - `damageMix()`: per team. It flags a lean when 4+ of 5 share a type, or 3 with none of the other. It returns null if any rating is missing, so a partial count never shows.
- `LiveGame.tsx` team header: "Damage mix: 2 AD · 3 AP · 0 mixed", plus a chip like "Mostly magic damage: magic resist pays off". The tooltip says it comes from Riot's champion ratings and that builds can change it.
- Strings `live.dmg*` in 7 languages. `tests/damageMix.test.ts` (2 tests, 116 total).

## Checks
tsc clean · a11y `{}` · demo `live-damage-mix.png` (Blue: 2 AD · 1 AP · 2 mixed; Red: 2 AD · 3 AP).

Known limits: the ratings are rough. Ezreal counts as mixed, and AP builds of AD champions aren't seen.

## Live check (2026-11-14 14:58)
- Deploy finished cleanly at 14:56. The server's `/api/static/en_US` now carries ratings for all 173 champions (Jinx `dmg: [9, 4]` → AD).
- None of the players at hand was in a game, so the live-game line itself was checked on the demo server only.
- Found: a browser that loaded static data before the deploy keeps its HTTP-cached copy (1 h) without `dmg`, so the line stays hidden there until the cache expires. Follow-up: add a version to the static URL so each deploy fetches fresh data.
