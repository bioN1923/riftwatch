# v3.117 — Arena augments in match history

**Why.** op.gg and u.gg show the augments in each Arena game; an Arena row here showed empty rune slots, and the post-game table showed empty rune circles plus CS and ward columns full of zeros. Augments are the main decision in an Arena game, so a history without them says little.

**What.**
- `shared/augments.ts`: slims CommunityDragon's `cdragon/arena/<locale>.json` (520 kB) to id → name, tier, icon and a plain description (45 kB). `@Value@` / `@Value*100@` tokens are filled from `dataValues`; if any token can't be resolved, the description is left out rather than shown with holes (200 of 225 have one).
- `/api/augments/:locale`: cached six hours per language, keeps the last good copy through a CDN error. Fetched by the browser only when an Arena game is on screen (`useAugments(enabled)`).
- Match row: for Arena games the runes column becomes the player's augments (2×2, 3×2 for six), ringed silver/gold/prismatic, with a tooltip of name, tier and description. Fixed dark tile behind the white glyphs so they read in the light theme too.
- Post-game: every player's augments next to their spells; CS and ward columns (and the narrow-screen CS line) are dropped when nobody in the game has any.
- Policy: augments appear only as what a player picked; no win rates or pick rates anywhere. `/api-usage` text updated to say so.
- Demo: the fifth game in every demo history is now an Arena game (also lets the v3.111 "Arena" queue label be seen); mock timelines treat Arena duos as sides.

**Checks.** tsc, 154 tests (4 new in `tests/augments.test.ts`), a11y `{}` (18 states × 2 themes). Demo: 4 augment icons load from CommunityDragon, tooltip "Ocean Soul · Silver augment · Gain the Ocean Soul, …", no console errors on expanding the Arena game. Romanian endpoint returns translated names.

Screens: `demo/arena-row-*.png`, `demo/arena-details.png`.

## Live check (2026-11-15 23:58 local)
- `/api/augments/en_US` → 200, 225 augments, 200 with descriptions; `ro_RO` gives Romanian names ("Exercițiu de încălzire"). An icon loads from CommunityDragon (200).
- Not seen on a real Arena game yet (none in the histories I may open); ids follow CommunityDragon's, which match Riot's `playerAugment` ids.
- Arena: 199 games (163 at 21:41 UTC); health `arena` queue 1750, 999 lined up.
