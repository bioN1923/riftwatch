# v3.124 — Arena tier list: average place; no empty ban column

**Why.** The Arena tier list showed the top-four rate ("Win rate") but not the average place, which is the number Arena players and other stats sites lead with. A champion that often finishes 1st and one that keeps scraping 4th both count as a "win". The Arena and ARAM lists also had a Ban rate column reading 0.0% on every row, since the demo records no bans in those modes.

**What.**
- `TierRow.avgPlacement` (Arena only) is worked out in `ChampStats.rows()` from the per-place counts (`ar.pl`) the server already keeps.
- Champions page:
  - in Arena, an **Avg place** column after Win rate, sortable ascending (best first); small-sample rows are faint as elsewhere;
  - sorting by it puts low-sample rows last, like the other rate columns;
  - the Ban rate column (header and cells) shows only when some row has a ban rate above 0.
- Strings already existed (`arena.avgPlaceShort`, `arena.avgPlace`).

**Checks.**
- tsc passes; 166 tests pass.
- a11y `{}`.
- Demo columns:
  - Arena: `# | Champion | Tier | Win rate | Avg place | Pick rate | Games`; sorting by Avg place puts Xayah (2.91) first;
  - Ranked: unchanged, ban column kept;
  - ARAM: ban column dropped (no bans in the demo data).

Screen: `demo/arena-tierlist.png`.

## Live check (2026-11-16 01:09 local)
- The live build serves `Champions-n5NsEPsX.js` (200).
- Live Arena tier list: all 173 rows carry `avgPlacement`. The best one with enough games is Rell (id 526), averaging 2.43 over 35 games.
- Live data does record Arena bans, so the Arena list keeps its Ban rate column. ARAM has none, so its column is hidden there. Ranked keeps it.
- Arena: 359 games.
