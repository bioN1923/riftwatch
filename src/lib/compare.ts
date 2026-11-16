import type { MatchSummary } from '../../shared/types';
import { kdaRatio } from './format';
import { me, overview, type Overview } from './stats';

/** Per-game averages for the comparison page. Remakes are left out. */
export interface PlayerSummary {
  games: number;
  wins: number;
  winRate: number;
  kda: number;
  kills: number;
  deaths: number;
  assists: number;
  kp: number;
  csMin: number;
  dmgMin: number;
  goldMin: number;
  visionMin: number;
  score: number;
  soloKills: number;
  /** Standard error of each per-game row (same keys as the comparison table), from game-to-game spread. */
  se: Record<string, number>;
  ov: Overview;
}

/** Standard error of a mean, from the per-game values. */
export function seOf(xs: number[]) {
  if (xs.length < 2) return Infinity;
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
  const v = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v / xs.length);
}

/**
 * Whether two players' values differ by more than chance would explain: the gap is over twice the
 * standard error of the difference. Returns -1 (A ahead), 1 (B ahead) or 0 (too close to call).
 */
export function clearEdge(va: number, vb: number, seA: number, seB: number, lowerBetter = false): -1 | 0 | 1 {
  const se = Math.sqrt(seA ** 2 + seB ** 2);
  if (!Number.isFinite(se) || Math.abs(va - vb) <= 2 * se) return 0;
  return (va > vb) !== lowerBetter ? -1 : 1;
}

export function summarize(matches: MatchSummary[], puuid: string): PlayerSummary {
  let n = 0, wins = 0, k = 0, d = 0, a = 0, kp = 0, cs = 0, dmg = 0, gold = 0, vision = 0, score = 0, solo = 0, minutes = 0;
  const vals: Record<string, number[]> = { wr: [], kda: [], k: [], d: [], a: [], kp: [], cs: [], dmg: [], gold: [], vision: [], solo: [], score: [] };
  for (const m of matches) {
    if (m.remake) continue;
    const p = me(m, puuid);
    if (!p) continue;
    n++;
    if (p.win) wins++;
    k += p.kills;
    d += p.deaths;
    a += p.assists;
    kp += p.killParticipation;
    cs += p.cs;
    dmg += p.damage;
    gold += p.gold;
    vision += p.visionScore;
    score += p.score;
    solo += p.extra?.soloKills ?? 0;
    minutes += m.duration / 60;
    const min = m.duration / 60 || 1;
    const add: Record<string, number> = {
      wr: p.win ? 1 : 0,
      kda: Math.min(20, kdaRatio(p.kills, p.deaths, p.assists)),
      k: p.kills,
      d: p.deaths,
      a: p.assists,
      kp: p.killParticipation,
      cs: p.cs / min,
      dmg: p.damage / min,
      gold: p.gold / min,
      vision: p.visionScore / min,
      solo: p.extra?.soloKills ?? 0,
      score: p.score,
    };
    for (const key in add) vals[key].push(add[key]);
  }
  const per = (x: number) => (n ? x / n : 0);
  const perMin = (x: number) => (minutes ? x / minutes : 0);
  return {
    games: n,
    wins,
    winRate: per(wins),
    kda: kdaRatio(k, d, a),
    kills: per(k),
    deaths: per(d),
    assists: per(a),
    kp: per(kp),
    csMin: perMin(cs),
    dmgMin: perMin(dmg),
    goldMin: perMin(gold),
    visionMin: perMin(vision),
    score: per(score),
    soloKills: per(solo),
    se: Object.fromEntries(Object.entries(vals).map(([key, xs]) => [key, seOf(xs)])),
    ov: overview(matches, puuid),
  };
}

/** Games both players appear in: as teammates, and against each other (from A's side). */
export function together(a: MatchSummary[], b: MatchSummary[], puuidA: string, puuidB: string) {
  const all = new Map([...a, ...b].map((m) => [m.id, m]));
  const out = { sameGames: 0, sameWins: 0, vsGames: 0, vsWinsA: 0 };
  for (const m of all.values()) {
    if (m.remake) continue;
    const pa = me(m, puuidA);
    const pb = me(m, puuidB);
    if (!pa || !pb) continue;
    const sameSide = pa.subteam ? pa.subteam === pb.subteam : pa.teamId === pb.teamId;
    if (sameSide) {
      out.sameGames++;
      if (pa.win) out.sameWins++;
    } else {
      out.vsGames++;
      if (pa.win) out.vsWinsA++;
    }
  }
  return out;
}

/** The role a player is in for most (60%+) of these games, or null when they're spread out. */
export function mainRole(s: Pick<PlayerSummary, 'games' | 'ov'>): string | null {
  if (!s.games) return null;
  const [role, n] = Object.entries(s.ov.roles).sort((x, y) => y[1] - x[1])[0] ?? [];
  return role && n / s.games >= 0.6 ? role : null;
}

/**
 * Two players who mostly play different roles: per-game numbers like CS, vision, damage or kill
 * participation say more about the role than the player, so only role-neutral rows are scored.
 */
export function differentRoles(a: Pick<PlayerSummary, 'games' | 'ov'>, b: Pick<PlayerSummary, 'games' | 'ov'>): [string, string] | null {
  const ra = mainRole(a);
  const rb = mainRole(b);
  return ra && rb && ra !== rb ? [ra, rb] : null;
}

/** The role a player plays most, with its share of their games (null with no games). */
export function topRole(s: Pick<PlayerSummary, 'games' | 'ov'>): { role: string; share: number } | null {
  if (!s.games) return null;
  const [role, n] = Object.entries(s.ov.roles).sort((x, y) => y[1] - x[1])[0] ?? [];
  return role ? { role, share: n / s.games } : null;
}

export type RoleGap =
  | { kind: 'different'; ra: string; rb: string }
  /** `who` has no clear main role (under 60% in one role); `role`/`share` is their most played. */
  | { kind: 'flex'; who: 'a' | 'b'; role: string; share: number };

/**
 * Why role-dependent rows can't be scored fairly, if they can't: the two mostly play different
 * roles, or one of them spreads their games over several roles and their most played role isn't
 * the other's. Two players whose most played role is the same compare fairly.
 */
export function roleGap(a: Pick<PlayerSummary, 'games' | 'ov'>, b: Pick<PlayerSummary, 'games' | 'ov'>): RoleGap | null {
  const ta = topRole(a);
  const tb = topRole(b);
  if (!ta || !tb || ta.role === tb.role) return null;
  if (ta.share >= 0.6 && tb.share >= 0.6) return { kind: 'different', ra: ta.role, rb: tb.role };
  const who = ta.share < tb.share ? 'a' : 'b';
  const t = who === 'a' ? ta : tb;
  return { kind: 'flex', who, role: t.role, share: t.share };
}

/** Rows that compare fairly across roles. */
export const ROLE_NEUTRAL = new Set(['wr', 'kda']);

/** Games and wins per role among the loaded (non-remake) games, for the role panel. */
export function roleRecord(matches: MatchSummary[], puuid: string): Record<string, { games: number; wins: number }> {
  const out: Record<string, { games: number; wins: number }> = {};
  for (const m of matches) {
    if (m.remake) continue;
    const p = me(m, puuid);
    if (!p || !p.position) continue;
    const r = (out[p.position] ??= { games: 0, wins: 0 });
    r.games++;
    if (p.win) r.wins++;
  }
  return out;
}
