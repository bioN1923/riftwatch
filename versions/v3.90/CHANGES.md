# v3.90 — Within a sitting

**Why.** "Should I stop after a loss?" is one of the most common questions players have, and tools like Porofessor hint at tilt but don't show the numbers. We already have the match times, so we can answer it from the player's own games — honestly.

**What.**
- New panel *Within a sitting* on the profile Stats tab (after *What your wins have in common*). Games are grouped into sittings: a new one starts after a break of an hour or more between one game ending and the next starting (`src/lib/sessions.ts`).
- **After a win vs after a loss**: the record of the next game in the same sitting.
- **Games 1–3 vs game 4 on** of a sitting.
- Each row needs 5+ games on both sides to show. Wording: "hardly change" under a 10-point gap; "clearly" only beyond two standard errors *and* with 10+ games on each side; anything else is labelled *Leaning … (too few games to be sure)* in muted text. The one bit of advice ("a short break may be worth trying") only appears for a clear drop after losses.
- Remakes are left out. Hidden when there are fewer than 10 games or nothing to compare.
- Demo data: games now come in sittings of four about 45 minutes apart (they were evenly 3 hours apart, which no real player does), so the panel and day headers look like real use.
- Strings in seven languages; `tests/sessions.test.ts` (134 tests).

**Checks.** tsc, tests, build, a11y `{}`. Demo shots `demo/sittings-*.png` (Caps: "hardly change"; Faker demo: 6–2 after a win vs 1–5 after a loss → a lean, not "clearly", on that few games).
