# v3.135 — No skeleton flash on filter changes, site-wide

**Why.** v3.134 fixed the champion page jumping on a role switch, which the user reported. The same pattern existed wherever a query key includes a filter. Checked page by page:

| Page | Filter | Before | Now |
|---|---|---|---|
| Matchup | lane, patch | skeleton, role tabs vanish | kept and dimmed, clicked tab highlighted at once |
| Champions tier list | patch | 10 skeleton rows | kept and dimmed (role tabs were already client-side) |
| Profile | queue filter | 5 skeleton cards, page shrinks | kept and dimmed |
| Draft helper | enemy's lane, blind-pick role | skeleton block | kept |
| Ladder | tier, page | already `keepPreviousData` | unchanged |
| Items | (no filter yet) | — | — |

**What.**
- `src/lib/keepWhile.ts` → `keepWhile(key, ...same)` builds a `placeholderData` function. It keeps the previous result while the new one loads, but only when the key parts at `same` (the subject: champion pair, player, enemy champion) are unchanged. A new subject still starts fresh, so you never see someone else's numbers.
- Each page dims the kept content (`opacity-60`, not clickable, `aria-busy`) while `isPlaceholderData`.

**Checks.**
- tsc passes; 182 tests pass (new `tests/keepWhile.test.ts`); a11y `{}`.
- Playwright with every API call slowed to 1.5 s. Page height (px) and skeleton count before, 350 ms into the load, and after it:

  | Change | Before | During | After |
  |---|---|---|---|
  | Matchup patch change | 2,222, 0 skeletons | **2,222, 0 skeletons, busy** | 1,921 |
  | Tier-list patch change | 2,989 | **2,989, 0 skeletons, busy** | 2,729 |
  | Profile queue filter | 4,218 | **4,158, 0 skeletons, busy** | 4,351 |

- No page errors.
- The demo has no matchup played in two lanes, so the lane switch itself was checked through the same code path as the patch switch.

Screen: `demo/matchup-switching.png` (dimmed while loading).
