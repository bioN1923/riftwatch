# v3.56: clickable timeline map (user request)

## Request (06:44)
"In timeline you should be able to click on map dots to see details about events that happened at that time in that location, like X killed Y, X killed Drake, Y triple kill."

## Changes
- **`src/lib/mapEvents.ts`** (pure, tested):
  - `multiKills(events)` finds multi-kills from the kill feed with League's rule: each kill within 10 s of the previous one, 30 s for the fifth. Kills by minions or towers don't count.
  - `happeningsNear(events, {t, x, y})` returns everything within 20 s and 2,200 map units of the clicked spot: kills, epic monsters and multi-kills, in time order.
  - `objectivePos(e)` uses Riot's position when the timeline has it, otherwise the monster's pit (Dragon, Baron/Herald/Grubs, Atakhan). That keeps timelines cached before this change working.
- **Server `shapeTimeline`:** epic-monster events now keep Riot's `killerId` (as `killer`) and `position`. The demo mock gives the kill to the team's jungler.
- **Timeline tab map:**
  - **Every dot is a button**, reachable by mouse, Tab and Enter/Space, and labelled e.g. "12:34 · Ahri killed Zed". Clicking shows a panel under the map: "Around 12:34, near here", with each happening listed, e.g. "**Ahri** killed **Zed** · with Lee Sin", "**Lee Sin** took **Infernal Drake**", "**Ahri**: Triple kill". Names are coloured by side. Click again or press Close to hide it.
  - **"This player / Everyone" toggle.** This player keeps the old green kills, red deaths and hollow assists. Everyone shows all kills, coloured by the killer's side.
  - **Epic monsters** are diamonds coloured by the side that took them, drawn on top. Several kills in one pit fan out so each can be clicked.
  - **ARAM games** now use the Howling Abyss map image and scale. Before, their kills were drawn over Summoner's Rift.
- 10 new strings in 7 languages. Tests: 99 pass (2 new: multi-kill rule including penta timing, clustering, pit fallback).

## Checks
- Typecheck clean, a11y `{}`.
- **Demo (Caps#EUW, 35-min game, Everyone):** 46 kill dots and 11 objective diamonds.
  - Clicking a mid-lane dot listed four fights within 15 s, with their assists.
  - Clicking a dragon diamond showed "Vi took Chemtech Drake".
  - Enter on a focused dot opens the panel.
- Screenshots: `demo/timeline-map-click.png`, `demo/timeline-map-objective.png`, plus the standard set.

## Live check (07:05)
- Deployed automatically (EXIT CODE 0, 07:03:59).
- **bioN1923#EUNE, latest game (Shyvana), Timeline tab → Everyone:** 44 kill dots and 9 epic-monster diamonds.
  - **First diamond (real Riot data):** "Around 6:44, near here: 6:39 Shyvana killed Shaco · with Kalista, Taric · 6:44 **Shyvana took Hextech Drake** · 6:53 Mel killed Taric · 6:58 Mel killed Shyvana · with Lillia · 6:58 **Mel: Double kill**".
  - **A mid-map dot:** "13:45 Gnar killed Nasus".
- Screenshot: `live/timeline-map.jpg`.
