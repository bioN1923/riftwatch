# v3.49: phone polish, profile ranks and champion numbers

## What the phone screenshots showed
- **Champion page:**
  - The five big numbers (Tier, Win rate, Pick rate, Ban rate, Games) wrapped 3 + 2 on phones.
  - Each stat had a left divider, so the wrapped row started with a stray line hanging at the edge (the `first-of-type` rule matched the Tier block, not the first stat). The rows didn't line up either.
- **Profile:** Solo/Duo and Flex were stacked one per row, each with a big emblem, so the match history started a full screen down.

## Changes
- **`Champion.tsx` `StatStrip`:**
  - on phones, a 3-column grid with aligned rows and no dividers; numbers are `text-3xl`, labels truncate;
  - from `sm` up it's the old single row with dividers (now `sm:border-l` on every stat);
  - the "small sample" note spans the full row.
- **`ProfileHeader.tsx` `RankBlock`:**
  - two columns on phones too, with the emblem (48 px) above the text;
  - tier text `text-xl` and LP `text-sm`;
  - from `sm` up, unchanged: emblem beside the text, 76/56 px, `text-3xl`/`text-2xl`.

## Checks
- 94 tests pass, typecheck clean, a11y `{}`.
- No horizontal overflow on the champion page (iPhone SE and iPhone 13).
- Before/after screenshots in `demo/`: `before-phone-*` and `phone-*` for iPhone SE and iPhone 13, plus the standard set.

## Live check (00:15)
- Deployed automatically (EXIT CODE 0, 00:14:23).
- The new classes are live: the champion stat strip has `grid grid-cols-3 … sm:flex` (renders as flex on desktop, unchanged), and the profile ranks have `grid grid-cols-2 … lg:flex`.
- **Desktop looks the same as before** (`live/profile-desktop.jpg`). The phone layout was checked in the demo screenshots, because the Chrome window can't be resized to phone width.
