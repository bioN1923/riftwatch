# v3.101 — Champion page: across patches

**Why.** Lolalytics and u.gg show how a champion moved over recent patches. Riftwatch kept four patches of data but the champion page only showed one at a time (the patch picker), and Patch movers only lists the biggest changes.

**What.**
- Server: `ChampionStats.history` — the chosen role on each kept patch (up to four), oldest first: games, win rate, pick rate.
- Champion page sidebar: *Across patches* table (patch, win rate, pick rate, games; the patch being viewed in bold) with a one-line verdict on the latest change, using the Patch movers bar: "Up/Down N points since 15.19: a real change, beyond normal swings." only beyond two standard errors with 20+ games on both patches; otherwise "No clear change since 15.19." or "Too few games on a patch to tell a change from chance." Patches under 20 games are faded with a *.
- Seven languages; server test for the history (144 tests).

**Checks.** tsc, tests, build, a11y `{}`. Demo Ahri mid: 52.5% (394) → 50.3% (443): "No clear change since 15.19." (a 2.2-point drop on those games is within 2 SE ≈ 6.9 points). Shots `demo/patch-history-*.png`.
