import type { TimelineEvent } from '../../shared/types';

type Kill = Extract<TimelineEvent, { type: 'kill' }>;
type Objective = Extract<TimelineEvent, { type: 'objective' }>;

export type TurningPoint =
  | { kind: 'firstBlood'; t: number; killer: number; victim: number; x: number; y: number }
  /** Team `team` gained `gold` on the other team between minute `from` and `to`. */
  | { kind: 'swing'; from: number; to: number; team: number; gold: number }
  /** A fight `team` won `won`-for-`lost`, with what they took right after. */
  | { kind: 'fight'; t: number; team: number; won: number; lost: number; objectives: Objective[]; towers: number; x: number; y: number }
  /** The winners were `gold` behind at `minute` and still won. */
  | { kind: 'comeback'; team: number; gold: number; minute: number }
  /** The winners took the lead at `minute` and never gave it back. */
  | { kind: 'led'; team: number; minute: number };

/** Kills chained no more than this many seconds apart count as one fight. */
export const FIGHT_GAP = 15;
/** What a team takes this soon after a fight counts as won off that fight. */
export const FOLLOW_UP = 90;
/** A comeback means being at least this far behind. */
export const COMEBACK_GOLD = 2500;
/** Gold swings are measured over this many minutes. */
export const SWING_MINUTES = 3;

const OBJECTIVE_WEIGHT: Record<string, number> = { BARON_NASHOR: 3, ELDER_DRAGON: 3, DRAGON: 1, RIFTHERALD: 1, ATAKHAN: 2 };

/** Kills grouped into fights: a new fight starts after a FIGHT_GAP-second lull. */
export function fights(events: TimelineEvent[]): Kill[][] {
  const kills = events.filter((e): e is Kill => e.type === 'kill').sort((a, b) => a.t - b.t);
  const out: Kill[][] = [];
  for (const k of kills) {
    const last = out[out.length - 1];
    if (last && k.t - last[last.length - 1].t <= FIGHT_GAP) last.push(k);
    else out.push([k]);
  }
  return out;
}

/**
 * The few moments that decided a game, from its timeline: first blood, the biggest gold swing, the
 * fight that paid off most for the winners, and whether they came back or led throughout.
 * `side[i]` is participant i's team (100 blue, 200 red); `diff[m]` is blue's gold lead at minute m.
 */
export function turningPoints(events: TimelineEvent[], diff: number[], side: number[], winner: number): TurningPoint[] {
  const out: TurningPoint[] = [];
  const teamOf = (i: number) => side[i] ?? 0;
  const lead = (m: number) => (winner === 100 ? diff[m] : -diff[m]); // the winners' lead

  const first = events.find((e): e is Kill => e.type === 'kill' && e.killer >= 0);
  if (first) out.push({ kind: 'firstBlood', t: first.t, killer: first.killer, victim: first.victim, x: first.x, y: first.y });

  // Biggest change in the gold lead over a few minutes, whoever it favoured.
  let best: { from: number; to: number; d: number } | null = null;
  for (let a = 0; a < diff.length; a++) {
    const b = Math.min(diff.length - 1, a + SWING_MINUTES);
    const d = diff[b] - diff[a];
    if (b > a && (!best || Math.abs(d) > Math.abs(best.d))) best = { from: a, to: b, d };
  }
  if (best && Math.abs(best.d) >= 1500) out.push({ kind: 'swing', from: best.from, to: best.to, team: best.d > 0 ? 100 : 200, gold: Math.round(Math.abs(best.d)) });

  // The fight that paid off most for the winners: kill difference plus what they took straight after.
  let decider: (TurningPoint & { kind: 'fight' }) | null = null;
  let score = 0;
  for (const f of fights(events)) {
    const won = f.filter((k) => k.killer >= 0 && teamOf(k.killer) === winner).length;
    const lost = f.filter((k) => teamOf(k.victim) === winner).length;
    const start = f[0].t;
    const end = f[f.length - 1].t;
    const after = (e: TimelineEvent) => e.t >= start && e.t <= end + FOLLOW_UP && 'teamId' in e && e.teamId === winner;
    const objectives = events.filter((e): e is Objective => e.type === 'objective' && after(e) && e.monster !== 'HORDE');
    const towers = events.filter((e) => e.type === 'building' && after(e)).length;
    const s = won - lost + objectives.reduce((n, o) => n + (OBJECTIVE_WEIGHT[o.monster] ?? 0), 0) + towers * 0.5;
    // Ties go to the later fight: late fights close games.
    if (won + lost >= 2 && won > lost && s >= score && s >= 2) {
      score = s;
      decider = { kind: 'fight', t: start, team: winner, won, lost, objectives, towers, x: f[0].x, y: f[0].y };
    }
  }
  if (decider) out.push(decider);

  if (diff.length > 1) {
    let worst = 0;
    let at = 0;
    diff.forEach((_, m) => {
      if (lead(m) < worst) {
        worst = lead(m);
        at = m;
      }
    });
    if (-worst >= COMEBACK_GOLD) out.push({ kind: 'comeback', team: winner, gold: Math.round(-worst), minute: at });
    else {
      // Last minute the winners were not ahead; they led from the next one on.
      let m = diff.length - 1;
      while (m > 0 && lead(m - 1) > 0) m--;
      if (m < diff.length - 1 && lead(m) > 0) out.push({ kind: 'led', team: winner, minute: m });
    }
  }
  return out;
}
