/**
 * "What's new" (/changelog): what changed for players, newest first, in plain words. Each
 * iteration of the improvement loop adds an entry here (the developer notes are in versions/).
 */
export interface ChangelogEntry {
  version: string;
  date: string; // ISO day
  items: string[];
}

/** True when version a ("3.35") is newer than b ("3.9" < "3.10"); everything is newer than "". */
export function newerThan(a: string, b: string) {
  if (!b) return true;
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return d > 0;
  }
  return false;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '3.155',
    date: '2026-11-16',
    items: ['Ladder: the "Find a player" box is wider on desktop and spans the full width on phones, so its hint ("Name#TAG") is no longer cut off in any language.'],
  },
  {
    version: '3.154',
    date: '2026-11-16',
    items: ['Game details, Item build: finished items in the item path now have a gold ring, so you can spot when each big item came online. A small key explains the ring and the crossed-out sold items.'],
  },
  {
    version: '3.153',
    date: '2026-11-16',
    items: ['Game details: the Damage column now has a small key (red = dealt, grey = taken), so you no longer have to hover to tell the two bars apart.'],
  },
  {
    version: '3.152',
    date: '2026-11-16',
    items: ['Items: each row now has a small bar showing how often the item is built compared with the most-built one, and its full gold cost.'],
  },
  {
    version: '3.151',
    date: '2026-11-16',
    items: [
      'Season win rates on profiles, live games, Compare and Multi-search, plus the scouting report, Arena top-4 rate and Draft blind picks, now use the same rule as the rest of the site: green or red only when the rate is clearly away from 50% for the number of games. For example, 54% over 269 games is a coin flip, not a strength, so it stays plain.',
    ],
  },
  {
    version: '3.150',
    date: '2026-11-16',
    items: ['Matchup page: "Other matchups" now shows how many games each one is based on, lists the most-played first, and only colours a win rate green or red when it is clearly off 50%. One-game 0% and 100% results no longer look like strong verdicts.'],
  },
  {
    version: '3.149',
    date: '2026-11-16',
    items: ['What\'s new: updates are grouped under one heading per day, and the page opens with the latest twelve (plus anything you haven\'t seen yet), with a button for older ones. It used to be one very long list.'],
  },
  {
    version: '3.148',
    date: '2026-11-16',
    items: ['Multi-search: each player card shows full champion names (no more "Kha\u2019\u2026" or "Miss \u2026"), with games, win rate and KDA on a line underneath.'],
  },
  {
    version: '3.147',
    date: '2026-11-16',
    items: ['Profile: in "Champion pool", each bar\'s length now shows how much the champion is played, and the green and red inside still show the record. A one-game 100% no longer looks as solid as a main.'],
  },
  {
    version: '3.146',
    date: '2026-11-16',
    items: ['Duo finder: before you enter a Riot ID, the page explains in three steps how it picks players, and notes that it only uses public match data and never contacts anyone.'],
  },
  {
    version: '3.145',
    date: '2026-11-16',
    items: ['Tier list: when sorted by tier, a stronger line marks where each tier ends (S+, S, A …), so the tiers are easier to see as you scroll.'],
  },
  {
    version: '3.144',
    date: '2026-11-16',
    items: ['Champion pages on phones: the Tier, Win rate and Pick rate labels at the top now line up in one row.'],
  },
  {
    version: '3.143',
    date: '2026-11-16',
    items: ['Profile stats: in a long champion pool, "Champions played" shows the first six rows for the chosen sort, with a button to show the rest. The Stats tab is shorter, and the rarely played picks are one click away.'],
  },
  {
    version: '3.142',
    date: '2026-11-16',
    items: ['Ladder: the win-rate column now shows a wins/losses split bar with a 50% mark, instead of a tiny sliver that was hard to read at top ranks where win rates sit close to 50%.'],
  },
  {
    version: '3.141',
    date: '2026-11-16',
    items: [
      'Compare: the "By role" panel now names each role, lists the most-played roles first and leaves out roles neither player plays.',
      'Compare: each role also shows how many games that player has there and their win rate in it, coloured only when the sample is big enough to mean something.',
    ],
  },
  {
    version: '3.140',
    date: '2026-11-16',
    items: [
      'The search box finds items too. Type “infinity” or “black cle” to open that item on the Items page.',
      'Items is now listed with the other tools on the home page and in the phone menu.',
    ],
  },
  {
    version: '3.139',
    date: '2026-11-16',
    items: ['Live game: under the lane matchup, the usual build into that opponent (keystone, core items and boots), straight from ranked games of that exact matchup.'],
  },
  {
    version: '3.138',
    date: '2026-11-16',
    items: ['Matchup pages open their build with the same “Build at a glance” strip: what to take into that specific opponent, in one row. It follows the rune page you pick.'],
  },
  {
    version: '3.137',
    date: '2026-11-16',
    items: ['Items page: filter by type (Attack damage, Ability power, Critical strike, Defence) and pick a patch. Your choice is kept in the address, so a filtered view can be shared.'],
  },
  {
    version: '3.136',
    date: '2026-11-16',
    items: [
      'Champion builds read more calmly: spells, starting items, boots, 4th–6th items and the game-length bars are green or red only when the gap from 50% is too large to be chance.',
      'Item choices bought in only a game or two are no longer listed as options.',
    ],
  },
  {
    version: '3.135',
    date: '2026-11-16',
    items: ['No more flashing grey boxes when you change a filter elsewhere either. On the matchup page (lane or patch), the tier list (patch), a profile’s queue filter and the Draft helper, the current results stay on screen, dimmed, until the new ones arrive.'],
  },
  {
    version: '3.134',
    date: '2026-11-16',
    items: [
      'Champion pages no longer jump about when you switch role or patch. The current numbers stay on screen, dimmed, until the new ones arrive, and the role you picked is highlighted straight away.',
      'A “Build at a glance” strip opens the build section: rune keystone, spells, starting items, core items, boots and skill order in one row. It follows the rune page you pick.',
    ],
  },
  {
    version: '3.133',
    date: '2026-11-16',
    items: [
      'Rune pages and builds have real names instead of “Page 1, 2, 3”, for example “Electrocute · Sorcery” or “Luden’s Echo first”.',
      'Picking a rune page now switches the Items section to the builds played with those runes, with a line saying how many games that is. Until a page has enough games of its own, the builds from every page are shown, and the page says so.',
      'Cleaner build cards: build variations seen in only a few games are left out, and boots and 4th–6th items after a build fall back to the champion’s usual picks when that build has too few games. Win rates on the cards are coloured only when the gap is too large to be chance.',
    ],
  },
  {
    version: '3.132',
    date: '2026-11-16',
    items: [
      'On champion pages, the core items and the 4th–6th item choices link to the Items page. It opens with that item expanded, showing who else builds it.',
      'Keyboard: g then i opens Items.',
    ],
  },
  {
    version: '3.131',
    date: '2026-11-16',
    items: ['New Items page, linked from Champions: every completed item with how often it’s built in ranked. Open one to see the champions who build it most, their win rate with it, and how that compares with their usual. That gap is coloured only when it’s too large to be chance.'],
  },
  {
    version: '3.130',
    date: '2026-11-16',
    items: ['Server housekeeping. Clearing out old cached matches no longer freezes the server, and statistics are now written to disk bit by bit instead of all at once, which removes the last regular pause of about half a second.'],
  },
  {
    version: '3.129',
    date: '2026-11-16',
    items: ['Faster responses. The server used to save its champion statistics and player index in one go, freezing every page load for a second or two about twice a minute. It now saves in small slices between requests.'],
  },
  {
    version: '3.128',
    date: '2026-11-16',
    items: ['Profiles describe the recent champion pool next to the last-20 record. “One-trick: Yasuo in 14 of 20” appears when one champion takes 60% of the games, and “Wide pool: 11 champions in 18 games” when there are ten or more.'],
  },
  {
    version: '3.127',
    date: '2026-11-16',
    items: ['Search takes a role or mode after the champion. “ahri mid”, “lee sin jg”, “mf adc”, “jinx aram” or “kai arena” opens the champion page straight in that role or mode.'],
  },
  {
    version: '3.126',
    date: '2026-11-16',
    items: ['The search box understands matchups. Type “ahri vs zed”, “mf v cait” or “lee sin - j4” and the first suggestion opens that matchup page. Nicknames work on both sides.'],
  },
  {
    version: '3.125',
    date: '2026-11-16',
    items: ['In browsers that can install web apps (Chrome, Edge, Android), an “Install app” button appears in the footer. It opens the browser’s own install dialog instead of a pop-up banner.'],
  },
  {
    version: '3.124',
    date: '2026-11-16',
    items: [
      'The Arena tier list has an “Avg place” column, sortable with the best average first: the number Arena players look at before the top-four rate.',
      'Tier lists hide the ban-rate column for modes where no bans are recorded, instead of filling it with 0.0%.',
    ],
  },
  {
    version: '3.123',
    date: '2026-11-16',
    items: [
      'Champion pages: the headline win rate and the “Best with” partners turn green or red only when the gap from 50% is too large to be chance. For example, Ahri’s 49.6% over 423 games now shows as plain rather than red.',
      'Duo finder: every suggested player has a “Compare with you” link that opens both of you side by side.',
    ],
  },
  {
    version: '3.122',
    date: '2026-11-16',
    items: ['Multi-search notices names pasted without a #tag, including English “Name joined the lobby” lines. It offers to add the server’s default tag (such as #EUW) in one click, instead of saying no Riot IDs were found.'],
  },
  {
    version: '3.121',
    date: '2026-11-16',
    items: [
      'Home page: champions you looked at recently now sit next to your recent players, one click back to each page, in the role you viewed.',
      'Home page spacing is even between sections. The patch-movers row now spans the full width when only one direction has movers.',
    ],
  },
  {
    version: '3.120',
    date: '2026-11-16',
    items: ['The same careful matchup call now runs everywhere. On champion pages, the counters strip and the lane matchups table colour a win rate only when the gap is too large to be chance. In the Draft helper, the ban suggestions do the same. Smaller gaps stay plain or dashed.'],
  },
  {
    version: '3.119',
    date: '2026-11-16',
    items: ['Matchup calls are more careful. A side is only called “favoured” (in green or red) when the gap is too large to be chance. A smaller gap reads “Leaning …, could still be chance”. The live game’s lane line now gives the same call as the matchup page, instead of colouring 48.7% over 113 games red.'],
  },
  {
    version: '3.118',
    date: '2026-11-16',
    items: ['Profile Stats tab: a new Arena panel for players with Arena games in their loaded history. It shows average place, top-four rate, first places, how often each place came up, the champions played and the augments picked most. Augments show only how often they were picked, never win rates.'],
  },
  {
    version: '3.117',
    date: '2026-11-15',
    items: [
      'Arena games in match history show the augments each player picked, with their tier (silver, gold or prismatic) and what they do on hover, in the row and in the post-game table. As Riot requires, there are no win rates for augments.',
      'Post-game tables leave out the CS and ward columns in modes that have neither, instead of showing zeros.',
    ],
  },
  {
    version: '3.116',
    date: '2026-11-15',
    items: ['Riftwatch can be added to your phone’s home screen or installed as an app on desktop: it now has an app icon, a name and shortcuts to Champions, the Ladder and the Draft helper. The browser bar matches the dark or light theme.'],
  },
  {
    version: '3.115',
    date: '2026-11-15',
    items: ['Ladder places now lead straight to the row: the “#357 on the EUW ladder” link on profiles, and the places in the climbing/dropping strip, open the right page with that player highlighted.'],
  },
  {
    version: '3.114',
    date: '2026-11-15',
    items: ['Ladder: next to “Climbing fastest”, a “Dropping fastest” line lists the five biggest LP losses in the tier, so the strip shows both directions.'],
  },
  {
    version: '3.113',
    date: '2026-11-15',
    items: ['Win rates on a handful of games (fewer than five) are no longer coloured green or red on Multi-search, Compare, the live game and champion pages: 1–0 isn’t winning, 0–2 isn’t losing.'],
  },
  {
    version: '3.112',
    date: '2026-11-15',
    items: ['Compare: “Best games” puts both players’ personal records side by side (most kills, best KDA, most damage, CS and vision per minute…), the better one in gold, each linking to that game.'],
  },
  {
    version: '3.111',
    date: '2026-11-15',
    items: ['Match lists and the live game call Arena games “Arena” again when Riot runs Arena under an event queue (they showed as “Special mode”).'],
  },
  {
    version: '3.110',
    date: '2026-11-15',
    items: ['Champion pages show the champion’s damage type next to its classes (Physical, Magic or Mixed damage), the same read the live game and the draft helper use.'],
  },
  {
    version: '3.109',
    date: '2026-11-15',
    items: ['Arena collection reads more of its line of Arena players when the ranked ladder is quiet, so the Arena tier list fills faster (still paced and paused while visitors use the site).'],
  },
  {
    version: '3.108',
    date: '2026-11-15',
    items: ['Arena collection fix: the Arena event’s own queue is now remembered across updates, and players lined up for Arena are read even when Arena runs under a queue we haven’t seen yet, so the Arena list grows again.'],
  },
  {
    version: '3.107',
    date: '2026-11-15',
    items: ['Challenger and Grandmaster profiles (and their Compare and Multi-search cards) show the LP change next to the ladder place, for example “#357 on the EUW ladder · +47 LP compared with yesterday”.'],
  },
  {
    version: '3.106',
    date: '2026-11-15',
    items: ['Home page: “Climbing fastest” shows the five biggest LP gains in your region’s Challenger since the earlier ladder snapshot, each linking to the player.'],
  },
  {
    version: '3.105',
    date: '2026-11-15',
    items: ['Ladder: a “Climbing fastest” strip above Challenger and Grandmaster lists the five players with the biggest LP gains in the whole tier since the earlier snapshot.'],
  },
  {
    version: '3.104',
    date: '2026-11-15',
    items: ['Matchup pages: “Across patches” shows how this matchup went on each recent patch, with the same plain verdict on whether the latest change is real.'],
  },
  {
    version: '3.103',
    date: '2026-11-15',
    items: ['Ladder: Challenger and Grandmaster show how much LP each player gained or lost since about a day ago (green and red numbers next to their LP).'],
  },
  {
    version: '3.102',
    date: '2026-11-15',
    items: ['Profiles show the player’s overall Challenges level and how far up they are (for example “Challenges: Diamond · top 4.2%”), with their challenge points on hover.'],
  },
  {
    version: '3.101',
    date: '2026-11-15',
    items: ['Champion pages: “Across patches” shows the champion’s win rate, pick rate and games on each recent patch, and says plainly whether the latest change is real or within normal swings.'],
  },
  {
    version: '3.100',
    date: '2026-11-15',
    items: ['Compare and Multi-search show the ladder place of Master, Grandmaster and Challenger players too (“#357 on the EUW ladder”), linking to that page of the ladder.'],
  },
  {
    version: '3.99',
    date: '2026-11-15',
    items: ['Arena collection keeps its list of Arena players to follow across server restarts, so the Arena tier list keeps growing after each update instead of starting over.'],
  },
  {
    version: '3.98',
    date: '2026-11-15',
    items: ['Tier lists no longer give a tier to champions with too few games (they show “–” instead of B, C or D), and a list that is all early data says so up front. The Arena list has its first games and is in that state now.'],
  },
  {
    version: '3.97',
    date: '2026-11-15',
    items: ['Keyboard shortcuts: press ? for the list, “g” then a letter to jump to a page (g c Champions, g l Ladder, g d Draft…), / to search. Also linked in the footer.'],
  },
  {
    version: '3.96',
    date: '2026-11-15',
    items: ['Draft helper: “Your team’s damage” — add your team’s picks as they lock in and see whether the damage leans physical or magic, so the last picks can balance it. Kept in the link, nothing saved.'],
  },
  {
    version: '3.95',
    date: '2026-11-15',
    items: ['Live game: Master, Grandmaster and Challenger players show their ladder place next to their LP (for example “760 LP · #512”).'],
  },
  {
    version: '3.94',
    date: '2026-11-15',
    items: ['Arena games are now recognised by their game mode too, so Arena events with a new queue (like 3×6) are counted instead of skipped; the Arena search also runs when the ladder is quiet.'],
  },
  {
    version: '3.93',
    date: '2026-11-15',
    items: ['Arena tier list: the collector now goes looking for Arena players by itself (a few everyday ranked players, a few times an hour), so the list can start filling without waiting for someone to look up an Arena player.'],
  },
  {
    version: '3.92',
    date: '2026-11-15',
    items: ['Profile Stats tab: Personal records — most kills, best KDA, most damage, biggest multi-kill, best CS and vision per minute and longest game among the loaded games. Each one jumps to that game in the match list.'],
  },
  {
    version: '3.91',
    date: '2026-11-15',
    items: ['Profiles of Master, Grandmaster and Challenger players show their place on the region’s ladder (for example “#357 on the EUW ladder”), linking straight to that page of the ladder.'],
  },
  {
    version: '3.90',
    date: '2026-11-15',
    items: ['Profile Stats tab: “Within a sitting” compares how you do right after a win and right after a loss, and in games 1–3 of a sitting against later ones. It only calls a difference clear with enough games on both sides.'],
  },
  {
    version: '3.89',
    date: '2026-11-15',
    items: ['When Riot’s rate limit is hit, the error panel now counts down and tries again by itself once the wait is over (up to twice), instead of leaving you to keep pressing Try again.'],
  },
  {
    version: '3.88',
    date: '2026-11-15',
    items: ['Match details, Item build tab: this game’s first three finished items and skill max order next to what high-elo players most often build on the same champion and role, with matching items outlined and a link to the full build.'],
  },
  {
    version: '3.87',
    date: '2026-11-15',
    items: ['Home page: under Strongest picks, the champions whose win rate clearly rose or fell since last patch (top three each way), each linking to its page.'],
  },
  {
    version: '3.86',
    date: '2026-11-14',
    items: ['Ladder: "Find a player" also looks in the other apex tiers. If your friend is in Master while you are on Challenger, it switches to the Master ladder and highlights them.'],
  },
  {
    version: '3.85',
    date: '2026-11-14',
    items: ['Profile Stats: a "Lane opponents" panel shows the champions you meet in your own lane most often, whatever you played, with your record against each. Small samples stay uncoloured.'],
  },
  {
    version: '3.84',
    date: '2026-11-14',
    items: ['Arena tier list: while it is empty, it explains where Arena games come from (players looked up on Riftwatch) instead of saying it reads high-elo ranked games.'],
  },
  {
    version: '3.83',
    date: '2026-11-14',
    items: ['Arena stats: the collector now finds Arena games through Arena players. Each Arena game Riftwatch reads lines up its other players, whose recent Arena games are read next. It no longer asks top ranked players, who hardly play Arena.'],
  },
  {
    version: '3.82',
    date: '2026-11-14',
    items: ['Profiles: win rates over fewer than 5 games (champion pool, champions played, roles, "often queues with", a champion\'s details) are no longer coloured green or grey. 3 of 4 is a coin flip, not a strength.'],
  },
  {
    version: '3.81',
    date: '2026-11-14',
    items: ['Arena stats work again. Riot moved Arena to a new queue (1710), so Riftwatch collected no new Arena games and the Arena tier list was empty. Old and new Arena games are now both recognised, and the profile\'s Arena filter asks for the current queue.'],
  },
  {
    version: '3.80',
    date: '2026-11-14',
    items: ['Tier list: sorting by win, pick or ban rate lists champions with few games in a role (marked *) after the rest, and their win rate is greyed out, so 66.7% over 36 off-role games no longer tops the list.'],
  },
  {
    version: '3.79',
    date: '2026-11-14',
    items: ['Profile Stats on phones: "Champions played" fits the screen, showing champion, games, win rate and KDA. The per-minute columns appear on wider screens.'],
  },
  {
    version: '3.78',
    date: '2026-11-14',
    items: ['Tier list and ladder on phones: the tables fit the screen. The tier list shows champion (with role), tier and win rate; the ladder shows games under the win rate. Nothing hides past the right edge anymore.'],
  },
  {
    version: '3.77',
    date: '2026-11-14',
    items: ['Match scoreboard on phones: each player\'s items and CS now show under their name, instead of in columns cut off past the right edge.'],
  },
  {
    version: '3.76',
    date: '2026-11-14',
    items: ['Profiles on phones: the last 20 games show as two rows of ten, all visible, instead of a strip cut off at the right edge.'],
  },
  {
    version: '3.75',
    date: '2026-11-14',
    items: ['Draft helper, "Ban for your pool": each suggestion now shows how many games it rests on. Bans where your pool only leans behind (it could still be chance) are marked and listed after the clear ones.'],
  },
  {
    version: '3.74',
    date: '2026-11-14',
    items: [
      'Multi-search lobby summary: "Nobody mains …" only shows once 4 or more players are loaded, where it means something.',
      'Home: the Duo finder joins the Tools section.',
    ],
  },
  {
    version: '3.73',
    date: '2026-11-14',
    items: ['Multi-search: a lobby summary above the cards shows the average rank, who mains which role, and flags roles two people main or nobody plays, so role calls are quicker.'],
  },
  {
    version: '3.72',
    date: '2026-11-14',
    items: [
      'Ladder: the Grandmaster and Master pages show the lowest LP in the tier above right now, and mark players who already have that much, so they are likely to move up at Riot\'s next daily update.',
      'Live game: the damage mix leaves out zero counts ("2 AD · 3 AP", not "… · 0 mixed").',
    ],
  },
  {
    version: '3.71',
    date: '2026-11-14',
    items: ['After an update, champion, item and rune data loads fresh at once, rather than up to an hour later from your browser\'s cache.'],
  },
  {
    version: '3.70',
    date: '2026-11-14',
    items: ['Live game: each team shows its damage mix (AD, AP and mixed champions), and flags a team that leans on one type, so you know whether armor or magic resist pays off.'],
  },
  {
    version: '3.69',
    date: '2026-11-14',
    items: ['Compare players: when one player is spread over several roles and their most played role differs from the other player\'s, role-dependent stats (CS, damage, vision, kills) no longer get a winner, and a note says why.'],
  },
  {
    version: '3.68',
    date: '2026-11-14',
    items: ['Compare players: a stat only gets the gold "better" mark when the gap is bigger than normal game-to-game swings. Differences that could be luck (like 50% vs 58% win rate over 18 games) are listed as too close to call.'],
  },
  {
    version: '3.67',
    date: '2026-11-14',
    items: ['"What your wins have in common": a "Make it a goal" button turns a condition (deaths, CS, kill participation or vision) into a goal on the Overview, with that value as the target.'],
  },
  {
    version: '3.66',
    date: '2026-11-14',
    items: ['Profile stats: "What your wins have in common" splits your recent games at your usual deaths, CS, kill participation, vision, damage share, game length and first blood, and shows where your win rate changes most. Small gaps are marked "could still be chance".'],
  },
  {
    version: '3.65',
    date: '2026-11-14',
    items: ['Profile match list: each day now says how long you played, and flags it when the day\'s last 3 or more games were all wins or all losses.'],
  },
  {
    version: '3.64',
    date: '2026-11-14',
    items: ['Turning points: opening the deciding fight on the map now lists all of its kills and what was taken after, and outlines all their dots, even when the fight spread across the map.'],
  },
  {
    version: '3.63',
    date: '2026-11-14',
    items: ['Turning points: click first blood or the deciding fight to see it on the map, in the same popup as the map dots.'],
  },
  {
    version: '3.62',
    date: '2026-11-14',
    items: ['Match timeline map: clicking a dot (or a row in the event list) opens a small popup right at that spot with what happened there. Close it with ×, Esc, or a click on empty map.'],
  },
  {
    version: '3.61',
    date: '2026-11-14',
    items: ['Match timeline: a short "Turning points" list says how the game went, covering first blood, the biggest gold swing, the fight that paid off most for the winners, and whether they came back or led to the end.'],
  },
  {
    version: '3.60',
    date: '2026-11-14',
    items: ['Match timeline on phones: tapping a row in the event list brings the map back into view, so you see where it happened.'],
  },
  {
    version: '3.59',
    date: '2026-11-14',
    items: [
      'Match timeline: click a row in the event list to see it on the map, and picking a map dot outlines the matching rows in the list.',
      'Duo finder: players you checked by Riot ID can be removed, and stay listed in this tab when you reload or come back from a profile.',
    ],
  },
  {
    version: '3.58',
    date: '2026-11-14',
    items: [
      'Duo finder: "Check a player" scores someone you already have in mind by Riot ID, or says plainly why they don\'t qualify (same role, rank too far apart, no recent ranked games).',
      'Duo finder: a "Check more players" button looks at the next 12 people from your recent games, only when you ask.',
      'Master, Grandmaster and Challenger ranks show without a division.',
    ],
  },
  {
    version: '3.57',
    date: '2026-11-14',
    items: ['New: Duo finder (in the menu, and "Find a duo" on every profile). It looks at the players from your recent ranked games who play other roles and are around your rank, and scores how well each would fit next to you: rank, role pairing, the hours you both play, champion styles, fights, vision and objectives, with every part shown.'],
  },
  {
    version: '3.56',
    date: '2026-11-14',
    items: [
      'Match timeline map: click (or Tab to) any dot to see what happened there and then: who killed whom with which assists, who took a Drake, Baron or Herald, and multi-kills like "Triple kill".',
      'The map can show just this player or everyone (by side), and epic monsters appear as diamonds. ARAM games now use the Howling Abyss map.',
    ],
  },
  {
    version: '3.55',
    date: '2026-11-14',
    items: ['Desktop: the sidebar on profiles and champion pages now scrolls along with the page until its last card is in view, instead of hiding its bottom until you reach the very end.'],
  },
  {
    version: '3.54',
    date: '2026-11-14',
    items: ['Counters are clearer about how sure they are: on champion pages and the tier list, matchups that are beyond chance come first in red or green, and ones that only lean that way are shown dashed or faded (hover to see why).'],
  },
  {
    version: '3.53',
    date: '2026-11-14',
    items: ['Tier list: a "Recently viewed" row with the champion pages you opened lately (in the role you looked at), one click away. Kept only in your browser, with a Clear button.'],
  },
  {
    version: '3.52',
    date: '2026-11-14',
    items: ['Keyboard users: text boxes (search, compare, multi-search, ladder, goals) show a clear gold focus ring, and the ladder no longer has an invisible stop when you Tab through it.'],
  },
  {
    version: '3.51',
    date: '2026-11-14',
    items: ['Easier to tap on phones: table sort headers, the queue filter on profiles, the Stats tab\'s metric buttons and the draft pool\'s remove buttons are bigger targets.'],
  },
  {
    version: '3.50',
    date: '2026-11-14',
    items: ['Phones: a more compact profile header (smaller icon, Update, Copy link and Compare in one row) so your games and tabs start much higher on the screen.'],
  },
  {
    version: '3.49',
    date: '2026-11-14',
    items: ['Phones: on profiles, Solo/Duo and Flex ranks sit side by side so your games start higher up, and the champion page numbers (tier, win, pick and ban rate, games) line up in a neat grid.'],
  },
  {
    version: '3.48',
    date: '2026-11-13',
    items: ['Riot server notices (outages, maintenance) now follow the page you\'re on: an EUNE profile shows EUNE notices, not EUW ones, and each notice names its server.'],
  },
  {
    version: '3.47',
    date: '2026-11-13',
    items: ['Faster first visit: game data (champions, items, runes, spells) now comes from Riftwatch in one small, compressed file instead of four large downloads from Riot (about 40% less to download, and much less for your browser to read).'],
  },
  {
    version: '3.46',
    date: '2026-11-13',
    items: ['Draft helper: each answer shows the range its real win rate likely falls in (e.g. 50–78% on 40 games), is only green when that whole range beats 50%, and solid results rank above lucky streaks on few games.'],
  },
  {
    version: '3.45',
    date: '2026-11-13',
    items: ['Ladder: Challenger and Grandmaster show how many players are in the tier and the lowest LP in it right now, roughly what it takes to get in.'],
  },
  {
    version: '3.44',
    date: '2026-11-13',
    items: ['Multi-search spots premades: players in the lobby who were on the same team in 2+ of their recent ranked games get a "Premade with …" tag (hover for the record).'],
  },
  {
    version: '3.43',
    date: '2026-11-13',
    items: [
      'Compare: when the two players mostly play different roles (say a jungler and a top laner), CS, damage, vision and kill numbers no longer pick a "winner"; only win rate and KDA do, and a note explains why.',
      'Live game: "New to champion" and "First time on champion" no longer show in ARAM, where champions are random.',
    ],
  },
  {
    version: '3.42',
    date: '2026-11-13',
    items: ['Live game: new player tags. "First time on champion" and "New to champion" (from champion mastery), plus Riot\'s "Veteran" (100+ games in the division) and "Just promoted". Hover a tag for the details.'],
  },
  {
    version: '3.41',
    date: '2026-11-13',
    items: ['Match history: hover "6 days ago" to see exactly when the game ended (day and time, in your time zone).'],
  },
  {
    version: '3.40',
    date: '2026-11-13',
    items: [
      'Search starts on the server of the player you looked at last, until you pick a region yourself (no more switching away from EUW every time if you play on EUNE).',
      'Home: a starred player is no longer listed twice, under Favorites and Recently viewed.',
    ],
  },
  {
    version: '3.39',
    date: '2026-11-13',
    items: ['Tier list and "Your champions": the win-rate change since last patch is only green or red when it\'s bigger than chance for the number of games. Smaller changes are grey (hover for details).'],
  },
  {
    version: '3.38',
    date: '2026-11-13',
    items: ['Patch movers are stricter: a change has to be too big to be chance (about twice the normal swing for its number of games), solid changes rank above big swings on few games, and each row shows the games on both patches.'],
  },
  {
    version: '3.37',
    date: '2026-11-13',
    items: ['A mistyped champion address now shows "Champion not found" in the browser tab and in link previews, instead of a page title for a champion that doesn\'t exist. Nickname links like /champions/mf open the right page even when shared in chats.'],
  },
  {
    version: '3.36',
    date: '2026-11-13',
    items: ['Champion addresses forgive typos and nicknames: riftwatch.fly.dev/champions/mf opens Miss Fortune, and a typo like "yasou" asks "Did you mean Yasuo?". Matchup links too.'],
  },
  {
    version: '3.35',
    date: '2026-11-13',
    items: ['"What\'s new" gets a gold dot when Riftwatch has changed since you last looked, and the new entries are marked on this page.', 'Every new page now opens at the top (some opened scrolled down to where you clicked). Back still returns you to where you were.'],
  },
  {
    version: '3.34',
    date: '2026-11-13',
    items: ['Phones: the search box at the top is wider (the language button shows just "EN"), most noticeably on small phones.'],
  },
  {
    version: '3.33',
    date: '2026-11-13',
    items: ['Shared multi-search and compare links are cleaner for names with spaces ("Annie+IRL" instead of "Annie%2520IRL"); old links still work.'],
  },
  {
    version: '3.32',
    date: '2026-11-13',
    items: ['Multi-search remembers your last 3 lobbies in this browser. Click one to scout the same players again.'],
  },
  {
    version: '3.31',
    date: '2026-11-13',
    items: ['Home: your favourites show the same, up-to-date rank as Recently viewed (they used to keep the rank from when you starred them).'],
  },
  {
    version: '3.30',
    date: '2026-11-13',
    items: ['Ladder: find a player by Riot ID. It jumps to their page and highlights them.'],
  },
  {
    version: '3.29',
    date: '2026-11-13',
    items: ['Match history: Ultimate Spellbook and Swarm games are named, and modes without minions or wards no longer show CS or vision as zero.'],
  },
  {
    version: '3.28',
    date: '2026-11-13',
    items: ['Match details: a link to how your lane matchup usually goes, so you can tell whether it was the matchup or the game.'],
  },
  {
    version: '3.27',
    date: '2026-11-13',
    items: ['Profiles: "Try next" suggests up to 3 champions you haven\'t been playing that fit your main role and style and are strong this patch.'],
  },
  {
    version: '3.26',
    date: '2026-11-13',
    items: ['Tier list: the champions you saved in the draft helper get a star, and "My pool" shows just them.'],
  },
  {
    version: '3.25',
    date: '2026-11-13',
    items: ['This page: a short list of what changed on Riftwatch, newest first.'],
  },
  {
    version: '3.24',
    date: '2026-11-13',
    items: ['Search: champion names are no longer cut off in the suggestions, on phones too.'],
  },
  {
    version: '3.23',
    date: '2026-11-13',
    items: ['Search understands champion nicknames: "mf", "tf", "j4", "asol", "lb", "ww", "gp" and more, in the top search, the tier list and the draft helper.'],
  },
  {
    version: '3.22',
    date: '2026-11-13',
    items: ['Champion stats fill up much faster: we now read new games from Master, Grandmaster and Challenger players, about 280 games an hour instead of about 17.'],
  },
  {
    version: '3.21',
    date: '2026-11-13',
    items: ['If your device is set to reduce motion, Riftwatch shows no animations.'],
  },
  {
    version: '3.20',
    date: '2026-11-13',
    items: [
      'Match history on phones: the game length and "days ago" no longer break across lines.',
      'Patch movers leave out changes that are within normal chance.',
    ],
  },
  {
    version: '3.19',
    date: '2026-11-13',
    items: ['Tier list: a champion needs a solid number of games to reach the top tiers, so a short lucky streak no longer shows as S+.'],
  },
  {
    version: '3.18',
    date: '2026-11-13',
    items: ['Draft helper: safe blind picks. Picking before you see your lane opponent? See champions with no hard counters.'],
  },
  {
    version: '3.17',
    date: '2026-11-13',
    items: ['Live game: see who you are probably laning against and how that matchup goes in ranked.'],
  },
  {
    version: '3.16',
    date: '2026-11-13',
    items: ['Draft helper: "Ban for your pool" shows the enemy laners your champions do worst against.'],
  },
  {
    version: '3.15',
    date: '2026-11-13',
    items: ['New phone menu with icons; Multi-search, Draft and Compare are under Tools.'],
  },
  {
    version: '3.14',
    date: '2026-11-13',
    items: ['Champion pages: how the lane usually goes (gold and CS lead at 5, 10 and 15 minutes) and whether the champion wins more in short or long games.'],
  },
  {
    version: '3.13',
    date: '2026-11-13',
    items: ['Shared draft and compare links show a preview image in chats and social apps.'],
  },
  {
    version: '3.12',
    date: '2026-11-13',
    items: ['Matchup pages: "How the lane goes", the gold and CS lead at 5, 10 and 15 minutes.'],
  },
  {
    version: '3.11',
    date: '2026-11-13',
    items: ['Profiles: compare your stats with high-elo players in your role, and a "Today" summary of your games and LP.'],
  },
  {
    version: '3.9',
    date: '2026-11-13',
    items: ['Draft helper: the best picks into an enemy laner, and how your own champions do against them.'],
  },
  {
    version: '3.8',
    date: '2026-11-13',
    items: ['Profiles: Patch watch (how your champions changed this patch) and Goals you can set for yourself.'],
  },
  {
    version: '3.7',
    date: '2026-11-13',
    items: ['Faster first visit to a profile.'],
  },
];
