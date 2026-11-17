# v3.213: tier letter aligned on champion pages

## ARAM growth (live, numbers only)
| Time (UTC) | `aram.queued` | ARAM games (16.22) |
|---|---|---|
| 04:49 (v3.211) | 38 | 269 |
| 04:55 (v3.212 live) | 153 | 279 |
| 04:58 | 229 | 284 |

The quiet-pass reads from v3.212 are working: about 5 new ARAM games a few minutes.

## What changed
- **`TierBadge`, large size:**
  - S+, S and A keep their box.
  - B, C, D and "–" have no border or fill, so the 48 px minimum width and centring made the letter look indented about 20 px from its "Tier" label (screenshot `v3.212/demo/12-phone-champion.jpg`).
  - Those tiers now sit on the label's left edge, at the same size as the other headline numbers (`text-3xl sm:text-4xl`), with the same top gap (`mt-0.5`).
- The table size (`md`) is unchanged, so tier-list columns stay aligned.

## Checks
- `tsc`, `vitest` (190) and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/`.
