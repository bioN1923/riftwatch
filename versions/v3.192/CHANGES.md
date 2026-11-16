# v3.192: line charts without clipped end labels

## What changed
- **Why:** `LineChart` (Stats Trends, match Metrics, the LP panel) writes each series' name at the right end of its line.
  - On a 390 px phone the 92 px gutter cut "5-game average" to "5-game avera…" and took about a quarter of the plot width.
  - On desktop, a 13-character limit also cut the same label.
  - The chart always draws a legend above it, so the end labels only repeat it.
- **`LineChart`:**
  - End labels show only when the chart is at least 520 px wide (`showEnds`). Narrower charts keep a 14 px right padding, so the plot uses the full width.
  - On wide charts, the gutter is 108 px (was 92), and names are cut only past 17 characters (was 13). "5-game average" now shows in full.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/trend-phone.png`, `demo/trend-desktop.png` and `demo/`.
