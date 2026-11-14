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
