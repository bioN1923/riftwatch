# v3.100 — Ladder place on Compare and Multi-search

**Why.** v3.91 and v3.95 added the ladder place to profiles and the live game. Compare and Multi-search show the same rank block, and for two Grandmasters "840 LP" vs "780 LP" says less than "#357" vs "#412".

**What.**
- `src/components/ui/LadderPlace.tsx`: the "#357 on the EUW ladder" link (with the "#57 of 700 in Grandmaster" tooltip) moved out of the profile header into a shared component; the profile header, Compare player cards and Multi-search player cards use it. Only Master+ players are looked up (cached apex leagues on the server).
- No new strings; 143 tests.

**Checks.** tsc, tests, build, a11y `{}`. Demo (profile response mocked to Grandmaster for a demo ladder player): both pages show "#357 on the EUW ladder" linking to Grandmaster page 2. Shots `demo/*-ladder-place.png`.
