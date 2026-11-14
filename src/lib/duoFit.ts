import type { MatchSummary } from '../../shared/types';

/**
 * Duo finder: how well another player would fit next to you, from both players' recent ranked games.
 * Every part of the score is shown to the visitor, and the samples are small (10–20 games), so this
 * is a rough guide, not a verdict on anyone.
 */

export type Lane = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';
const LANES: Lane[] = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
const CLASSES = ['Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank'] as const;

export interface PlayStyle {
  games: number;
  wins: number;
  mainRole: Lane | null;
  roleShare: number;
  visionPerMin: number;
  objectivePerMin: number; // damage to epic monsters and buildings
  actionPerMin: number; // kills + deaths per minute: how fight-heavy their games are
  kp: number;
  classes: Record<string, number>; // share of games on each champion class
  hours: number[]; // share of games started in each hour of the day (visitor's time zone)
}

export function playStyle(matches: MatchSummary[], puuid: string, tagsOf: (championId: number) => string[], hourOf = (ms: number) => new Date(ms).getHours()): PlayStyle {
  const s: PlayStyle = { games: 0, wins: 0, mainRole: null, roleShare: 0, visionPerMin: 0, objectivePerMin: 0, actionPerMin: 0, kp: 0, classes: {}, hours: new Array(24).fill(0) };
  const roles: Record<string, number> = {};
  let minutes = 0;
  for (const m of matches) {
    if (m.remake) continue;
    const p = m.participants.find((x) => x.puuid === puuid);
    if (!p) continue;
    const min = m.duration / 60;
    s.games++;
    if (p.win) s.wins++;
    minutes += min;
    if (p.position) roles[p.position] = (roles[p.position] ?? 0) + 1;
    s.visionPerMin += p.visionScore;
    s.objectivePerMin += p.extra?.objectiveDamage ?? 0;
    s.actionPerMin += p.kills + p.deaths;
    s.kp += p.killParticipation;
    for (const tag of tagsOf(p.championId).slice(0, 1)) s.classes[tag] = (s.classes[tag] ?? 0) + 1;
    s.hours[hourOf(m.startedAt)]++;
  }
  if (!s.games) return s;
  s.visionPerMin /= minutes;
  s.objectivePerMin /= minutes;
  s.actionPerMin /= minutes;
  s.kp /= s.games;
  for (const k in s.classes) s.classes[k] /= s.games;
  s.hours = s.hours.map((h) => h / s.games);
  const [role, n] = Object.entries(roles).sort((a, b) => b[1] - a[1])[0] ?? [];
  s.mainRole = (role as Lane) ?? null;
  s.roleShare = n ? n / s.games : 0;
  return s;
}

const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND'];
const DIVS: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };
/** A rank as a number of divisions from Iron IV (Master and up count as one step above Diamond I). */
export function rankSteps(tier?: string, rank?: string): number | null {
  if (!tier) return null;
  const i = TIERS.indexOf(tier);
  if (i >= 0) return i * 4 + (DIVS[rank ?? 'IV'] ?? 0);
  return ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier) ? 28 : null;
}
/** "Around your rank": within 4 divisions, roughly one tier either way. */
export const MAX_RANK_GAP = 4;

const SYNERGY = new Set(['JUNGLE+MIDDLE', 'JUNGLE+TOP', 'BOTTOM+UTILITY', 'JUNGLE+UTILITY', 'MIDDLE+UTILITY', 'JUNGLE+BOTTOM']);
const pair = (a: Lane, b: Lane) => [a, b].sort((x, y) => LANES.indexOf(x) - LANES.indexOf(y)).join('+');
const near = (a: number, b: number) => (a + b === 0 ? 1 : 1 - Math.abs(a - b) / Math.max(a, b));

export interface FitPart {
  key: 'rank' | 'role' | 'time' | 'champions' | 'fights' | 'vision' | 'objectives';
  score: number; // 0..1
  weight: number;
}
export interface Fit {
  score: number; // 0..100
  parts: FitPart[];
}

/**
 * How well `them` fits next to `me`. Null when they can't be a duo for this purpose: same main role,
 * no ranked games, or more than about a tier apart.
 */
export function duoFit(me: PlayStyle, meRank: number | null, them: PlayStyle, themRank: number | null): Fit | null {
  if (!me.mainRole || !them.mainRole || me.mainRole === them.mainRole || !them.games) return null;
  if (meRank == null || themRank == null || Math.abs(meRank - themRank) > MAX_RANK_GAP) return null;
  const overlap = (a: Record<string, number>, b: Record<string, number>) => CLASSES.reduce((n, c) => n + Math.min(a[c] ?? 0, b[c] ?? 0), 0);
  const parts: FitPart[] = [
    { key: 'rank', weight: 0.2, score: 1 - Math.abs(meRank - themRank) / (MAX_RANK_GAP + 1) },
    { key: 'role', weight: 0.15, score: SYNERGY.has(pair(me.mainRole, them.mainRole)) ? 1 : 0.6 },
    { key: 'time', weight: 0.2, score: me.hours.reduce((n, h, i) => n + Math.min(h, them.hours[i]), 0) },
    // Different champion classes make a rounder team (an assassin jungler next to a tank support).
    { key: 'champions', weight: 0.15, score: 1 - overlap(me.classes, them.classes) },
    // Similar appetite for fights and for objectives; more vision than you is a plus.
    { key: 'fights', weight: 0.1, score: near(me.actionPerMin, them.actionPerMin) },
    { key: 'vision', weight: 0.1, score: them.visionPerMin >= me.visionPerMin ? 1 : them.visionPerMin / Math.max(me.visionPerMin, 1e-9) },
    { key: 'objectives', weight: 0.1, score: near(me.objectivePerMin, them.objectivePerMin) },
  ];
  const score = Math.round(parts.reduce((n, p) => n + p.score * p.weight, 0) * 100);
  return { score, parts };
}
