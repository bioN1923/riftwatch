# v3.184: charts readable on touch screens

## What changed
- **Why:** on a phone, the match Timeline tab said "Hover the chart for the gold lead at each minute" and "Click a dot on the map". The charts listened only to pointer *moves*, so a tap didn't reliably show anything. On touch, `pointerleave` fires right after the finger lifts, which hid the readout again at once.
- **`GoldChart` and `LineChart`** (`LineChart` is used by match Metrics, the LP panel and the stats tab):
  - `onPointerDown` also sets the reading, so a tap shows that minute.
  - `touch-action: pan-y` lets a sideways drag move along the chart, while vertical drags still scroll the page.
  - The pointer-leave reset only applies to mouse pointers, so on touch the reading stays after lifting the finger. It moves on the next tap.
- **Wording:**
  - `tl.hover` is now "Hover or tap the chart…".
  - `tl.mapHint` is now "Tap a dot on the map…".
  - Both are in all 7 languages; the Romanian map hint already said "Apasă".
  - English was edited in `en.json`; other languages were appended to their text files.

## Also checked (phone, 390 px)
- Match details: the Post game, Performance, Item build and Metrics tabs read fine.

## Checks
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Touch test (Playwright `hasTouch`): tapping the gold chart shows "Minute 22 · Red side ahead by 11.2k · Baron", and it stays visible.
- Screenshots: `demo/gold-tap.png` and `demo/`.
