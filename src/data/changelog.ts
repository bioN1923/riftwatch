/**
 * "What's new" (/changelog): what changed for players, newest first, in plain words. Each
 * iteration of the improvement loop adds an entry here (the developer notes are in versions/).
 */
export interface ChangelogEntry {
  version: string;
  date: string; // ISO day
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
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
