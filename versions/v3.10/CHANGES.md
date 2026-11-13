# v3.10 — find the tools, trust the numbers, accessible (13 Nov 2026)

Iteration 4.

## Improved
- **Home page "Tools" row**: Draft helper, Compare, Multi-search and Ladder, each with a line on
  what it's for. On phones the bottom bar only fits four links, so the newer tools were hard
  to find there.
- **Draft helper flags small samples**: matchups with fewer than 30 games say "small sample"
  (the live site showed Ahri "75%" vs Zed from 24 games). Ranking already used the adjusted
  rate; now the raw number doesn't over-promise either.
- **Accessibility**: ran an automated WCAG 2 A/AA check (axe-core) on 8 main pages in dark and
  light themes. One issue: links inside paragraphs (privacy and API pages) were told apart
  by color only — now underlined. All pages pass with zero violations.

## Tooling
- `scripts/a11y-check.cjs` — the accessibility check, runnable against the local demo server.

## Checked, no change needed
- Bundle size: first load ≈135 KB gzipped (React, router, query, English strings);
  other languages and pages load on demand.
