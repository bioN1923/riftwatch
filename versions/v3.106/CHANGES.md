# v3.106 — Home: climbing fastest

**What.**
- Ladder API: `view=climbers` returns only the tier's climbers (no page of entries, so no name lookups). Reading it also keeps the ladder's LP snapshots coming (v3.103), since home visits are far more frequent than ladder visits.
- Home page, after Strongest picks: "Climbing fastest in {region} Challenger" — five cards (name, place, LP, "+90"), linking to the profiles, with "Full ladder". Uses the visitor's region (read, not written). Hidden until there's a snapshot an hour old and at least three named climbers.
- Three strings in seven languages; 147 tests.

**Checks.** tsc, tests, build, a11y `{}` (18 states × 2 themes). Demo API: `view=climbers` → 0 entries, 5 climbers. Shots `demo/home-climbers-*.png`.
