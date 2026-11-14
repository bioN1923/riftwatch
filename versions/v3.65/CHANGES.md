# v3.65 — Day headers: time played and how the day ended

Moving off the timeline to the profile match list, which is grouped by day ("Saturday 7 Nov · 1W 5L").

## Change
- `Sidebar.tsx` `dayRecord` now also returns:
  - `played`: seconds in games that day, remakes included, since that's time spent;
  - `end`: the run of identical results among the day's latest games (newest first, remakes skipped).
- `Profile.tsx` day header: "Thursday 12 Nov · 3 h 56 min played · [lost the last 3] · 1W 7L".
  - The chip shows for runs of 3+, green for wins and red for losses.
  - It's worded "lost the last N" so it also reads right for today, which isn't over.
  - `hoursMinutes()` gives "45 min", "2 h", "2 h 15 min".
- Strings `profile.dayPlayed`, `profile.h/hm/m`, `profile.dayEndWins_*`, `profile.dayEndLosses_*` in 7 languages, with Polish/Romanian plural forms.
- New `tests/dayRecord.test.ts` (2 tests).

## Checks
tsc clean · 108 tests pass · a11y `{}` · demo `day-header-desktop.png`, `day-header-phone.png`, `day-header-streak-top.png` (Perkz: "lost the last 3").

## Live check (2026-11-14 08:37)
- Deploy finished cleanly. bioN1923's day headers now read:
  - "Saturday 7 Nov · 2 h 52 min played · lost the last 4 · 1W 5L"
  - "Wednesday 4 Nov · 33 min played · 1W 0L"
  - "Monday 2 Nov · 2 h 39 min played · 2W 2L"
  - …

  Screenshot: `live/day-headers.jpg`.
