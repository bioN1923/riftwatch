# v3.43: fair comparisons across roles

## Live check that started it
On the live site I compared bioN1923 (Jungle in 20 of 20 games) with koga40 (Top in 19 of 19). The per-game table gave a "winner" for CS, vision, damage, kill share and solo kills, then tallied "bioN1923 better in 7, koga40 in 5". Those numbers mostly reflect the role, not the player.

## Changes
- **`src/lib/compare.ts`:**
  - `mainRole(summary)`: the role in 60%+ of the games, or null;
  - `differentRoles(a, b)`: both players have a main role and they differ;
  - `ROLE_NEUTRAL = {wr, kda}`.
- **`Compare.tsx` `Metrics`:** with different main roles, only win rate and KDA are highlighted and counted in "better in N". The other rows still show both values and bars, but no gold winner. A note explains it, e.g. "Caps mostly plays Jungle and Faker Support. CS, damage, vision and kill numbers depend a lot on role, so only win rate and KDA get a winner here." Players in the same role, or with no clear main role, are unchanged.
- **Live tags, from the v3.42 note:** `liveTags(scout, queueId)` drops "First time / New to champion" in random-champion queues (`RANDOM_CHAMP_QUEUES` = 100, 450, 720, 900, 2400). Arena keeps them, because Arena champions are picked.
- String `cmp.rolesDiffer` in 7 languages.
- Tests: 88 pass, 3 new (`mainRole`/`differentRoles` and the queue rule).

## Checks
- Typecheck clean, a11y `{}`.
- Demo Caps (Jungle) vs Faker (Support): the note shows, only WR and KDA are highlighted, and the tally reads "Caps better in 0, Faker in 2" (`demo/compare-roles-differ.png`).

## Live check (23:21)
- Deployed automatically (EXIT CODE 0, 23:20:19).
- bioN1923 vs koga40: the note "bioN1923 mostly plays Jungle and koga40 Top…" is shown.
- The tally went from "better in 7 / 5" to **"bioN1923 better in 0, koga40 in 2"**. Only win rate (58%) and KDA (2.27) are highlighted, both for koga40.
- Screenshot: `live/compare.jpg`.
