# v3.110 — Damage type on champion pages

**What.** Next to a champion's classes (Mage, Assassin…), a tag "Physical damage" (orange), "Magic damage" (blue) or "Mixed damage", from Riot's attack and magic ratings via `damageType()` — the same read as the live game's team mix (v3.70) and the draft helper's team damage (v3.96). Tooltip: builds can change it. Three strings plus the tooltip in seven languages; 148 tests.

**Checks.** tsc, tests, build, a11y `{}` (dark and light). Demo: Zed physical, Ahri magic, Kayle mixed. Shot `demo/champion-damage-tag.png`.

## Live check (2026-11-15)
Deployed 22:41 (local). Champion pages aren't opened in the owner's browser; the tag reads the same live static damage ratings already verified in v3.96 (Zed/Draven/Lee Sin physical, Syndra magic). Arena: **52 games** at 22:42 (36 at 22:32), queue 1750, line full.
