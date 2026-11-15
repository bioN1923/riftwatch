# v3.96 — Draft: your team's damage mix

**Why.** "We have no AP" is one of the most common champion-select problems, and the draft helper only looked at your own lane. The live game already shows each team's damage mix (v3.70); the same read helps *during* the draft, while picks can still change.

**What.**
- New section *Your team's damage* at the end of the Draft helper: add up to five picks (the same champion search/grid as the lane picker), each labelled Physical / Magic / Mixed from Riot's attack and magic ratings, with a summary like "3 AD · 1 AP — A fair mix so far." or "Mostly physical: the enemy can stack armor. A magic-damage pick would balance it." Same lean rule as the live game (4+ of one type, or 3 with none of the other).
- Picks live in the URL (`?team=zed,draven,…`) — shareable with the team, nothing written to the browser. Each pick can be removed.
- Note under it that builds can change a champion's damage. Strings in seven languages.

**Checks.** tsc, 142 tests, build, a11y `{}`. Demo: Zed/Draven/Lee Sin → "3 AD — Mostly physical…"; adding Syndra by search + Enter → "3 AD · 1 AP — A fair mix so far.", URL updated. Shots `demo/team-damage-*.png`.
