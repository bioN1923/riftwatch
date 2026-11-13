# v3.15 — 13 Nov 2026

## Live check (before)
- Pages answer in about 40 ms (one cold 0.66 s on `/draft`, 36 ms on repeat).
- The lane backfill is moving: Ahri vs Syndra has 12 lane games now (was 8, then 9). Its gold at 15 went from +586 (9 games) to +115 (12 games), against −122 over all 50 games: that's very noisy at small samples.
- New ranked games are coming in slowly this morning (6,661 → 6,667).
- **Phone check (375×812):** home and profile/match history look right (`live/before-phone-*.jpg`). But the phone's bottom bar only had Players, Champions, Ladder and Lobby, so **the Draft helper and Compare couldn't be reached from the menu on a phone**. Also, "Players" wasn't highlighted while viewing a player's profile.

## Changed
- **Phone navigation** (`MobileNav` in `Layout.tsx`):
  - Four tabs with icons and labels: Players, Champions, Ladder, Tools.
  - Tools opens a small menu with Multi-search, Draft and Compare. It closes on Escape, a tap outside, or navigation, and uses `aria-expanded`/`aria-controls`.
  - Players stays highlighted on player profiles.
  - Respects the iPhone home-indicator safe area.
- **Matchup lane charts need 10 games** with 5/10/15-minute frames (was 5; `MATCHUP_LANE_MIN`). The "Still filling in" note still shows while fewer games than the rest of the page are counted.

## Checks
- 59 tests pass, typecheck, build and a11y check clean; phone menu checked in Playwright (open, Escape, tap through to Draft) in dark and light.
- Demo: `demo/nav-*.png`.

## Live check (after deploy)
- Deployed 13 Nov 2026 12:02 (deploy.log EXIT CODE 0). The first copy to the PC failed with HTTP 503 from the file service; it went through on retry.
- Phone (375×812) on `/lol/euw1/Kaori-EUW33`: the bottom bar shows Players (highlighted), Champions, Ladder, Tools. Tools opens Multi-search, Draft and Compare (`live/phone-profile-tools-menu.jpg`).
