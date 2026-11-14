# v3.58 — Duo finder: check a player, check more

Follows up the v3.57 duo finder.

## Changes
- **Check a player** (`CheckPlayer` / `CheckedPlayer` in `src/pages/Duo.tsx`): type any Riot ID; Riftwatch loads that profile and their last 10 ranked solo games (the same two lookups the list uses) and scores them with `duoFit`. If they don't qualify, the box says why: same main role, rank more than 4 divisions away, unranked, no recent ranked games, not found, or "That's you". Up to 4 checks are kept on screen; duplicates are ignored. Short boxes no longer stretch to the height of a full card (`items-start`).
- **Check more players**: the candidate pool is paged (`pages` state; 12 more co-players checked, 5 more scored per page). The button only appears while unchecked co-players remain, so the API is used only when asked.
- **Apex ranks**: `rankLabel()` shows "Master" rather than "Master I" in the basis line, rank rows and the reasons.
- Strings `duo.more_*`, `duo.check*`, `duo.whyNot.*` in all 7 languages.

## Checks
tsc clean · 101 tests pass · a11y `{}` · demo shots in `demo/` (`duo-more.png`, `duo-check.png`).
