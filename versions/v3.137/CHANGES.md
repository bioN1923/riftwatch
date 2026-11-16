# v3.137 — Items page: type filters and patch selector

**Why.** The Items page (v3.131) listed 40–100 items in one long list, sorted by popularity. Looking for "the AP items" or "last patch" meant scrolling or rewriting the address by hand.

**What.**
- The slimmed static data now keeps Riot's item `tags` (Damage, SpellDamage, CriticalStrike, Health, Armor, SpellBlock…). It is cached in server memory only, so a deploy picks it up at once.
- Type chips, all derived from those tags and kept in the address as `?kind=`:
  - **All**;
  - **Attack damage** (Damage);
  - **Ability power** (SpellDamage);
  - **Critical strike** (CriticalStrike);
  - **Defence** (Health, Armor or Magic resist, with no damage stats).
- A **patch** selector (shared `PatchSelect`), kept in the address as `?patch=`. Switching patch keeps the list on screen, dimmed, until the new one arrives (`keepWhile`, as in v3.135).
- Strings `it.kinds` and `it.kind.*` in 7 languages. The active chip uses normal text colour on its gold tint, which fixes light-theme contrast flagged by a11y.

**Checks.**
- tsc passes; 182 tests pass (the slim-static test now expects `tags`); a11y `{}`.
- Demo:
  - All 41;
  - Attack damage 17 (Black Cleaver, Death's Dance, Sterak's Gage…);
  - Ability power 13 (Rabadon's, Ardent Censer, Redemption…);
  - Critical strike 7 (Rapid Firecannon, Infinity Edge, The Collector…);
  - Defence 8 (Mikael's, Thornmail, Zeke's…).
  - Patch 15.20 → 15.19 changes the address to `?kind=ap&patch=15.19` and the lead to "17,672 ranked builds … patch 15.19".
- No page errors.

Screen: `demo/items-ap.png`.

## Live check (2026-11-16 06:46 local)
- The live build serves `Items-B0xWb99n.js` (200), and live static data now carries item tags.
- Live Items: 102 items. By type: Attack damage 44, Ability power 34, Critical strike 14, Defence 22. Four patches can be picked: 16.22, 16.21, 16.20, 16.19.
- Live Ahri mid per-page builds: [7, 0, 1].
