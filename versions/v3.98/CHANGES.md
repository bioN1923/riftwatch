# v3.98 — No tiers on too few games

**Why.** The Arena list got its first data (13 games). Through the API, all 66 champions were `lowSample`, yet they had tiers B, C and D: low-sample rows were only capped at B, so a champion seen twice still got a grade. A tier on 2–3 games is a guess presented as a verdict.

**What.**
- Server (`champStats.rows`): a low-sample row (under max(20, 0.5% of games)) gets tier `–` ("too few games to rank") instead of B/C/D. It keeps its place in the list. Applies to every group, so ranked rows with few games also say `–` rather than a grade (the demo ranked list has none).
- Tier list: when every row is low-sample, a note above the table: "Only 13 games collected so far: too few to rank any champion yet. Tiers appear once a champion has about 20 games; until then this lists what has been seen." Seven languages.
- Low-sample rows no longer draw a win-rate bar (its length reads as a result); the faded rate with its * stays.
- Server test updated: low-sample rows must be `–`.

**Checks.** tsc, 142 tests, build, a11y `{}`. Demo with the Arena response mocked to the live situation (13 games, all low-sample): note shown, tier column all "–", no bars. Shot `demo/arena-early.png`.
