# v3.114 — Ladder: dropping fastest

**What.**
- Ladder API: `fallers` — the five biggest LP losses in the tier since the snapshot, same rules as `climbers` (named players from known names only, hidden players left out, one row per player).
- Ladder strip: two lines, "Climbing fastest (compared with …)" and "Dropping fastest (compared with …)", with red "−50" for losses; an sr-only heading "Biggest LP changes" over both.
- Fix found in the demo: repeated demo names could pair a player with someone else's earlier LP (−583); rows are now one per player.
- Two strings in seven languages; 150 tests.

**Checks.** tsc, tests, build, a11y `{}`. Demo strip shows both lines. Shots in `demo/`.

## Live check (2026-11-15)
Deployed 23:21 (local). EUNE Challenger (`view=climbers`): climbers +116, +116, +89, +52, +44; fallers −105 (#95), −97 (#18), −90 (#8), −80 (#200), −70 (#40). Arena: **141 games**, 688 lined up.
