# v3.9 — draft helper (13 Nov 2026)

Iteration 3.

## New
- **Draft helper** (`/draft`, in the top menu and on the tier list): pick your role and the
  enemy laner from a champion-select-style grid. It lists the best answers from Riftwatch's
  lane matchup data (only matchups that favour you, with enough games, gold lead at 15), and
  ranks **your own champion pool** against that enemy, with "your best pick". The pool is saved
  per role in the browser, and can be filled from any Riot ID's recent games in that role.
  Links open the full matchup page. The state is in the URL, so a draft can be shared.
  Op.gg/u.gg have counter lists per champion; none rank *your* pool against the enemy.

## Improved
- **Patch movers on phones** show three per side with "Show all", so the tier list isn't
  pushed a full screen down; movers are listed in order of the change shown.

## Screenshots
- `demo/13-draft.jpg` — the draft helper; other standard pages as before.
