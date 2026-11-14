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
