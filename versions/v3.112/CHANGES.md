# v3.112 — Compare: best games

**What.** A *Best games* table at the end of Compare: for most kills, best KDA, most damage, biggest multi-kill, CS and vision per minute (the v3.92 personal-records rules: no remakes or Arena, per-minute only on 15+ minute Summoner's Rift games), each player's best game — champion icon and value — with the higher one in gold (ties, like 9.00 vs 9.00, stay plain). Each value opens that game in the player's match list (`#m-<id>`). Three strings in seven languages; 149 tests.

**Checks.** tsc, tests, build, a11y `{}`. Demo Caps vs Rekkles: kills 14 vs 11, KDA 9.00 vs 9.00, damage 52.8k vs 46.2k, CS/min 9.3 vs 9.1, vision/min 1.7 vs 3.1. Shots `demo/compare-best-*.png`.
