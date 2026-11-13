# v3.17 — 13 Nov 2026

## Idea
During the loading screen, a player wants to know "who am I laning against, and how does that go?" Riot's live game (spectator) data doesn't include roles, so the Live tab only listed the two teams.

## Added
- **Live game: lane matchup.** On a profile's Live tab (Summoner's Rift 5v5 queues only), a card shows the player's champion vs their guessed lane opponent, e.g. "Kha'Zix vs Sylas in Jungle":
  - the champion's ranked win rate in that matchup (with game count; needs 10+ games) and gold lead at 15;
  - an "Open matchup" link to the full matchup page (build, runes, lane curve);
  - a short line saying the opponent is guessed, because the game doesn't share roles.
- **Role guessing** (`src/lib/lanes.ts`, `guessRoles`): tries all 120 ways to give a team's five champions the five roles and keeps the likeliest, using how often each champion is played in each role this patch (from the tier list, with a small prior for rare picks) plus Smite, which all but marks the jungler. Done for both teams; the opponent is the enemy given the same role.
- No extra Riot API calls: it uses the tier list and matchup data Riftwatch already has.
- Translated in all 7 languages.

## Checks
- 64 tests pass (new: usual roles, Smite deciding a flex pick, five-player requirement). Typecheck, build and a11y check clean.
- Demo: `demo/live-*.png`. On phone the text wraps under the champion icons (the first version squeezed it into a narrow column).
