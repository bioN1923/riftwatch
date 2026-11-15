import type { MatchSummary } from '../../shared/types';
import { isArenaMatch } from '../../shared/queues';
import { me } from './stats';

export interface ArenaSummary {
  games: number;
  avgPlacement: number;
  top4: number;
  firsts: number;
  /** Games finishing 1st … 8th. */
  placements: number[];
  /** Champions played, most games first (ties: better average place). */
  champions: { championId: number; games: number; avgPlacement: number; top4: number }[];
  /** The player's own augment picks, most picked first. Counts only: no win rates (Riot's policy). */
  augments: { id: number; picks: number }[];
}

/** The player's Arena games among the loaded ones; null when there are none. */
export function arenaSummary(matches: MatchSummary[], puuid: string): ArenaSummary | null {
  const placements = Array(8).fill(0) as number[];
  const champs = new Map<number, { games: number; place: number; top4: number }>();
  const augs = new Map<number, number>();
  let games = 0;
  let placeSum = 0;
  for (const m of matches) {
    if (m.remake || !isArenaMatch(m)) continue;
    const p = me(m, puuid);
    if (!p?.placement || p.placement < 1 || p.placement > 8) continue;
    games++;
    placeSum += p.placement;
    placements[p.placement - 1]++;
    const c = champs.get(p.championId) ?? { games: 0, place: 0, top4: 0 };
    c.games++;
    c.place += p.placement;
    if (p.placement <= 4) c.top4++;
    champs.set(p.championId, c);
    for (const a of p.augments ?? []) augs.set(a, (augs.get(a) ?? 0) + 1);
  }
  if (!games) return null;
  return {
    games,
    avgPlacement: placeSum / games,
    top4: placements.slice(0, 4).reduce((a, b) => a + b, 0),
    firsts: placements[0],
    placements,
    champions: [...champs]
      .map(([championId, c]) => ({ championId, games: c.games, avgPlacement: c.place / c.games, top4: c.top4 }))
      .sort((a, b) => b.games - a.games || a.avgPlacement - b.avgPlacement),
    augments: [...augs].map(([id, picks]) => ({ id, picks })).sort((a, b) => b.picks - a.picks || a.id - b.id),
  };
}
