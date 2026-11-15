# v3.87 — Home: patch movers

**Why.** The Champions page already lists patch movers (win-rate changes since the previous patch that pass a two-standard-error test, ranked by the change we can be fairly sure of), but the home page — where most visits start — only showed the strongest pick per role. Sites like u.gg and op.gg surface "rising/falling" champions up front; we had the honest data already.

**What.**
- Under *Strongest picks* the home page now shows two compact rows, *Rising since {patch}* and *Falling since {patch}*, with the top three champions each way (icon, name, role, change). Hovering shows the old → new win rate. Each links to the champion page for that role.
- Uses the tier-list response the section already loads — no extra request. Rows hide when there is no clear mover that way; the whole strip hides with no previous patch.
- Strings in all seven languages.

**Checks.** tsc, 123 tests, build, a11y `{}`. Demo shots: `demo/home-movers-desk.png`, `demo/home-movers-phone.png` (demo data has only fallers, so the rising row is hidden — as intended).

## Live check (2026-11-15)
Deployed 15:39 (local). On riftwatch.fly.dev, patch 16.22 against 16.21: *Rising* — Sylas, Cassiopeia, Lux; *Falling* — Vladimir, Aurora, Zaahen (server order: by the change we can be fairly sure of, so Cassiopeia +10.3% sits above Lux +10.6% on more games). Screenshot `live/home-movers.png` (cropped to the section; saved players left out). Arena tier list still has 0 matches.
