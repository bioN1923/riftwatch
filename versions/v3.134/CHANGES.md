# v3.134 — Role switch without the jump; Build at a glance

**Reported** (user, 06:02): "On the champion page, when clicking Top, Jungle, Mid etc. the layout breaks for a second. After everything loads it works normally."

**Cause.** The champion query is keyed by role. A new role meant a new query with no data, so:
- the page fell back to its first-load state: the stat strip became a skeleton, the role tabs disappeared (they're drawn from the data), and the body became two grey blocks;
- then everything came back. The page shrank and grew again, the tabs vanished and reappeared, and the scroll position jumped.

**Fix.**
- `placeholderData` keeps the previous result while a new **role or patch** loads (same champion and mode only; a different champion or mode still starts fresh).
- While the old numbers are shown (`isPlaceholderData`), the body is dimmed (`opacity-60`), not clickable, and marked `aria-busy`.
- The role tab you clicked is highlighted at once, taken from the address rather than from data that hasn't arrived yet.

**Also: Build at a glance** (continuing the build-design work from v3.133).
- A strip at the top of the build panel: keystone and secondary tree, spells, starting items, core items (linked to Items), boots and skill max, with short labels.
- It follows the rune page picked below. It uses that page's main build once the page has its own, otherwise the overall one, and its boots only with 10+ games. The picked page's name sits at the right.
- It wraps to two or three rows on phones.
- Strings `cp.glance`, `cp.coreShort`, `cp.glanceSpells`, `cp.glanceStart` and `cp.glanceSkills` in 7 languages.

**Checks.**
- tsc passes; 181 tests pass; a11y `{}`.
- Role switch with the champion API slowed to 1.5 s in Playwright:
  - **during** the load, page height stayed at 3,312 px, with 0 skeletons, the body `aria-busy`, all 5 role tabs still there and "Support" already highlighted;
  - **after** it, the new role's content (2,387 px, since Support has fewer games), with nothing busy.
- Glance strip checked at 1280 px dark and 390 px light, on both rune pages.

Screens: `demo/role-switch-loading.png`, `demo/glance-*.png`.
