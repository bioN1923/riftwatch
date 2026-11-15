# v3.110 — Damage type on champion pages

**What.** Next to a champion's classes (Mage, Assassin…), a tag "Physical damage" (orange), "Magic damage" (blue) or "Mixed damage", from Riot's attack and magic ratings via `damageType()` — the same read as the live game's team mix (v3.70) and the draft helper's team damage (v3.96). Tooltip: builds can change it. Three strings plus the tooltip in seven languages; 148 tests.

**Checks.** tsc, tests, build, a11y `{}` (dark and light). Demo: Zed physical, Ahri magic, Kayle mixed. Shot `demo/champion-damage-tag.png`.
