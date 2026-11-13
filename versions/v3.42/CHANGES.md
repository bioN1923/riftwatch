# v3.42: live game player tags

Borrowed from Porofessor, whose main value is short tags per player in the loading screen. Riftwatch already had three tags (Champion specialist, Hot streak, High win rate). The most useful one in practice was missing: **is this player new to the champion they just locked in?**

## Changes
- **Server, `/api/scout`:** the champion-mastery lookup now tells three cases apart.
  - Riot returned 404 (the player has never played it) → `mastery: { level: 0, points: 0 }`.
  - The lookup failed → `null`, as before.
  - The demo mock produces all three cases.
- **`src/lib/liveTags.ts` `liveTags(scout)`:** one pure function for all tags.
  - Champion specialist: ≥ 300k points.
  - **First time on champion:** 0 points.
  - **New to champion:** under 10k points, roughly a handful of games.
  - Hot streak.
  - High win rate: ≥ 62% over 20+ games.
  - **Veteran / Just promoted:** Riot's own `veteran` / `freshBlood` flags on the ranked entry.
  - Nothing for hidden players. Nothing either when the mastery lookup failed, so "unknown" never becomes "first time".
- **`LiveGame.tsx`:**
  - tags come from `liveTags`;
  - the tooltip says why (e.g. "Only 8.5k mastery points on Kha'Zix: a handful of games");
  - the "· 0 mastery" text is hidden.
- The new tags are neutral grey, not red: it's information for both teams, not a verdict.
- 8 new strings in 7 languages. Tests: 85 pass (2 new).

## Checks
- Typecheck clean, a11y `{}`.
- Demo live game (Caps-EUW): tags for Champion specialist ×3, New to champion ×2, Hot streak and First time on champion (Caitlyn).
- Screenshots: `demo/live-tags-desktop.png` and `demo/live-tags-phone.png` (in the full-page shot the phone nav bar overlaps the middle), plus the standard set.
