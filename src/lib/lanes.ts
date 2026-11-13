import type { TierRow } from '../../shared/types';

export const LANE_ROLES = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const;
export type LaneRole = (typeof LANE_ROLES)[number];
const SMITE = 11;
/** Summoner's Rift 5v5 queues: draft, solo/duo, blind, flex, quickplay, swiftplay. */
export const SR_QUEUES = new Set([400, 420, 430, 440, 480, 490]);

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((rest) => [x, ...rest]));
}
const ORDERS = permutations([...LANE_ROLES]);

/** How often each champion is played in each role, from the tier list (all ranked games this patch). */
export function roleGames(rows: TierRow[]) {
  const out = new Map<number, Partial<Record<LaneRole, number>>>();
  for (const r of rows) {
    if (!(LANE_ROLES as readonly string[]).includes(r.role)) continue;
    const m = out.get(r.championId) ?? {};
    m[r.role as LaneRole] = (m[r.role as LaneRole] ?? 0) + r.games;
    out.set(r.championId, m);
  }
  return out;
}

/**
 * Spectator data doesn't say who plays which role, so guess it: try all 120 ways to give a team's
 * five champions the five roles and keep the likeliest, judged by how often each champion is
 * played in each role (with a small prior so rare picks still fit somewhere) and by Smite, which
 * all but marks the jungler. Returns null when the team isn't five players.
 */
export function guessRoles(team: { championId: number; spells: number[] }[], games: Map<number, Partial<Record<LaneRole, number>>>): LaneRole[] | null {
  if (team.length !== 5) return null;
  const score = (p: (typeof team)[number], role: LaneRole) => {
    const g = games.get(p.championId) ?? {};
    const total = LANE_ROLES.reduce((n, r) => n + (g[r] ?? 0), 0);
    let s = Math.log(((g[role] ?? 0) + 1) / (total + 5));
    const smite = p.spells.includes(SMITE);
    if (role === 'JUNGLE') s += smite ? 4 : -4;
    else if (smite) s -= 4;
    return s;
  };
  let best: LaneRole[] = ORDERS[0];
  let bestScore = -Infinity;
  for (const order of ORDERS) {
    const s = order.reduce((n, role, i) => n + score(team[i], role), 0);
    if (s > bestScore) {
      bestScore = s;
      best = order;
    }
  }
  return best;
}
