import type { MatchSummary } from '../../shared/types';
import { me } from './stats';

export interface LaneOpponent {
  championId: number;
  games: number;
  wins: number;
}

/**
 * The champions a player meets in their own lane most often across their games (any champion
 * they played), with their record against each. The lane opponent is the enemy in the same
 * position; games without positions (ARAM, Arena) and remakes are skipped.
 */
export function laneOpponents(matches: MatchSummary[], puuid: string): { list: LaneOpponent[]; games: number } {
  const tally = new Map<number, LaneOpponent>();
  let games = 0;
  for (const m of matches) {
    if (m.remake) continue;
    const p = me(m, puuid);
    if (!p?.position) continue;
    const o = m.participants.find((x) => x.teamId !== p.teamId && x.position === p.position);
    if (!o) continue;
    games++;
    const t = tally.get(o.championId) ?? { championId: o.championId, games: 0, wins: 0 };
    t.games++;
    if (p.win) t.wins++;
    tally.set(o.championId, t);
  }
  const list = [...tally.values()].sort((a, b) => b.games - a.games || a.wins / a.games - b.wins / b.games);
  return { list, games };
}
