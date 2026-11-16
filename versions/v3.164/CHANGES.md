# v3.164: no ban rate on ARAM

## What changed
- **Why:** the champion page header on the ARAM tab showed "Ban rate 0.0%". ARAM has no bans, so the number meant nothing and read as "nobody bans this champion". The tier list already hides its ban column when every rate is zero; the champion header didn't.
- **Fix:** `StatStrip` takes `bans` (true only for ranked) and leaves the ban-rate stat out otherwise. Arena uses its own strip, which never had one.
- **Demo:** ARAM Ahri shows Tier · Win rate · Pick rate · Games. Ranked Ahri still shows Ban rate 20.8%.
- **Team-draft data:** the live test draft still has lane (38) and duo (53) reasons only. Neither count moved in the last 25 minutes, so few new games were read in that window, and no ally/enemy pair has reached 10 games yet.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/` and `demo/aram-strip.png`.
