import type { MatchSummary } from '../../shared/types';
import { me } from './stats';

export type WinMetric = 'deaths' | 'cs' | 'kp' | 'vision' | 'share' | 'length' | 'firstBlood';

export interface WinCondition {
  metric: WinMetric;
  /** The cut-off for the "when" side (e.g. 5 deaths or fewer); unused for firstBlood. */
  at: number;
  when: { w: number; l: number };
  otherwise: { w: number; l: number };
  /** Win-rate gap, when − otherwise; always positive (see `flip`). */
  gap: number;
  /** The "when" side is the opposite one: below the cut-off (or above, for deaths and length; no first blood). */
  flip: boolean;
  /** Bigger than twice its standard error: unlikely to be chance alone. */
  sure: boolean;
}

/** Fewest games on each side of a split before it is worth showing. */
export const MIN_SIDE = 4;
/** Smallest win-rate gap worth mentioning. */
export const MIN_GAP = 0.15;

interface Game {
  win: boolean;
  v: Record<WinMetric, number>;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Round a cut-off the way it will be shown, so the label and the split agree. */
const roundAt: Record<WinMetric, (x: number) => number> = {
  deaths: (x) => Math.round(x),
  cs: (x) => Math.round(x * 10) / 10,
  kp: (x) => Math.round(x * 100) / 100,
  vision: (x) => Math.round(x * 10) / 10,
  share: (x) => Math.round(x * 100) / 100,
  length: (x) => Math.round(x),
  firstBlood: () => 1,
};
/** For these, the "when" side is the low side (fewer deaths, shorter games). */
const LOW_IS_WHEN: Partial<Record<WinMetric, true>> = { deaths: true, length: true };

/**
 * What the player's wins have in common: for each stat, split their games at their usual value
 * (the median) and compare win rates on each side. Returns the splits with a gap of at least
 * MIN_GAP, biggest gap beyond its noise first, each marked sure or not.
 */
export function winConditions(matches: MatchSummary[], puuid: string): WinCondition[] {
  const games: Game[] = [];
  for (const m of matches) {
    const p = me(m, puuid);
    if (!p || m.remake || !m.duration) continue;
    const min = m.duration / 60;
    const team = m.participants.filter((x) => x.teamId === p.teamId).reduce((s, x) => s + x.damage, 0);
    games.push({
      win: p.win,
      v: {
        deaths: p.deaths,
        cs: p.cs / min,
        kp: p.killParticipation,
        vision: p.visionScore / min,
        share: p.damage / Math.max(1, team),
        length: min,
        firstBlood: p.extra?.firstBlood ? 1 : 0,
      },
    });
  }
  const out: (WinCondition & { rank: number })[] = [];
  for (const metric of Object.keys(roundAt) as WinMetric[]) {
    const at = metric === 'firstBlood' ? 1 : roundAt[metric](median(games.map((g) => g.v[metric])));
    const isWhen = (g: Game) => (metric === 'firstBlood' ? g.v.firstBlood === 1 : LOW_IS_WHEN[metric] ? g.v[metric] <= at : g.v[metric] >= at);
    const a = { w: 0, l: 0 };
    const b = { w: 0, l: 0 };
    for (const g of games) {
      const side = isWhen(g) ? a : b;
      if (g.win) side.w++;
      else side.l++;
    }
    const na = a.w + a.l;
    const nb = b.w + b.l;
    if (na < MIN_SIDE || nb < MIN_SIDE) continue;
    const gap = a.w / na - b.w / nb;
    const pooled = (a.w + b.w) / (na + nb);
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / na + 1 / nb)) || 1;
    if (Math.abs(gap) < MIN_GAP) continue;
    // Always describe the side the wins are on.
    const flip = gap < 0;
    out.push({ metric, at, when: flip ? b : a, otherwise: flip ? a : b, gap: Math.abs(gap), flip, sure: Math.abs(gap) > 2 * se, rank: Math.abs(gap) - se });
  }
  return out.sort((x, y) => y.rank - x.rank).map(({ rank: _rank, ...c }) => c); // eslint-disable-line @typescript-eslint/no-unused-vars
}
