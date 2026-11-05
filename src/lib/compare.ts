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
  ov: Overview;
}

export function summarize(matches: MatchSummary[], puuid: string): PlayerSummary {
  let n = 0, wins = 0, k = 0, d = 0, a = 0, kp = 0, cs = 0, dmg = 0, gold = 0, vision = 0, score = 0, solo = 0, minutes = 0;
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
