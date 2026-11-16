# v3.199: match cards use portrait art (half the bytes)

## Measured
On a phone, images were most of each page's weight: about 1.5 MB on a profile and 1.8 MB on a champion page.
- **Match cards:** each card's splash column (92 px wide on phones, 132 px from `sm`) loaded Data Dragon's 1280×720 `champion/centered/*_0.jpg`, about 80–130 KB each.
- **Loading-screen art** (`champion/loading/*_0.jpg`, 308×560) for the same champions:

  | Champion | centered | loading |
  |---|---|---|
  | Viego | 130 KB | 53 KB |
  | Vi | 130 KB | 57 KB |
  | Fiora | 110 KB | 45 KB |
  | Aurora | 106 KB | 50 KB |
  | Sylas | 91 KB | 50 KB |
  | Graves | 91 KB | 38 KB |
  | Lee Sin | 79 KB | 35 KB |

  Roughly 55–60% less, and the portrait shape fits the tall column.
- **Champion page:** its heaviest images are two keystone icons Riot serves at about 355 KB each (Deathfire Touch and Stormraider's Surge). They already load lazily, and shrinking them would need a resizing proxy, so they're left for a later version.

## What changed
- **`assets.portrait(id)`** in `ddragon.ts` returns the loading-screen art.
- **`MatchRow`:** the splash column uses it, with the focal point at `center 15%`.
- **Unchanged:** the profile header backdrop and the home tier cards keep the wide splash, because they're wide crops.

## Checks
- Phone and desktop screenshots: the champions are framed well.
- `tsc`, `vitest` and `vite build` pass.
- a11y: `{}`.
- Screenshots: `demo/match-rows-phone.png`, `demo/match-rows-desktop.png` and `demo/`.
