# v3.106 — Home: climbing fastest

**What.**
- Ladder API: `view=climbers` returns only the tier's climbers (no page of entries, so no name lookups). Reading it also keeps the ladder's LP snapshots coming (v3.103), since home visits are far more frequent than ladder visits.
- Home page, after Strongest picks: "Climbing fastest in {region} Challenger" — five cards (name, place, LP, "+90"), linking to the profiles, with "Full ladder". Uses the visitor's region (read, not written). Hidden until there's a snapshot an hour old and at least three named climbers.
- Three strings in seven languages; 147 tests.

**Checks.** tsc, tests, build, a11y `{}` (18 states × 2 themes). Demo API: `view=climbers` → 0 entries, 5 climbers. Shots `demo/home-climbers-*.png`.

## Live check (2026-11-15)
Deployed 22:00 (local). Home (owner's region EUNE): "Climbing fastest in EUNE Challenger" with five named players (+116, +89, +87, +75, +48), matching the ladder strip. Arena: 21 games, 160 lined up.

**Fixed after the check:** the relative time read badly once the snapshot was hours rather than a day old ("since 3 hours ago"). The three strings now say "compared with {when}" ("…compared with 3 hours ago", "…compared with yesterday"), in all seven languages. Redeployed.
