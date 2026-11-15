import type { MatchSummary } from '../../shared/types';
import { me } from './stats';

/** A new sitting starts when more than this passes between one game ending and the next starting. */
export const SESSION_GAP_MS = 60 * 60_000;
/** Fewest games on each side of a comparison before it is shown. */
export const MIN_SPLIT = 5;
/** Fewest games on each side before a difference is called clear rather than a lean. */
export const SURE_SPLIT = 10;
/** Below this win-rate gap the two sides are called the same. */
export const SAME_GAP = 0.1;

export interface Record2 {
  w: number;
  l: number;
}

export interface Split {
  a: Record2;
  b: Record2;
  /** Win-rate difference, a − b. */
  gap: number;
  /** 'same' when the gap is small, 'sure' beyond twice its standard error, 'leaning' otherwise. */
  verdict: 'same' | 'leaning' | 'sure';
}

export interface Sessions {
  games: number;
  sessions: number;
  /** Games in sittings of more than one game. */
  inRuns: number;
  /** Next game in the same sitting after a win (a) or after a loss (b). */
  afterResult: Split | null;
  /** Games 1–3 of a sitting (a) against game 4 onwards (b). */
  early: Split | null;
}

export function split(a: Record2, b: Record2): Split | null {
  const na = a.w + a.l;
  const nb = b.w + b.l;
  if (na < MIN_SPLIT || nb < MIN_SPLIT) return null;
  const gap = a.w / na - b.w / nb;
  const pooled = (a.w + b.w) / (na + nb);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / na + 1 / nb)) || 1;
  const verdict = Math.abs(gap) < SAME_GAP ? 'same' : Math.abs(gap) > 2 * se && Math.min(na, nb) >= SURE_SPLIT ? 'sure' : 'leaning';
  return { a, b, gap, verdict };
}

const add = (r: Record2, win: boolean) => (win ? r.w++ : r.l++);

/** How results go within a sitting: after a win or a loss, and early or late in a long sitting. */
export function sessions(matches: MatchSummary[], puuid: string): Sessions {
  const games = matches
    .map((m) => ({ m, p: me(m, puuid) }))
    .filter((x) => x.p && !x.m.remake && x.m.startedAt != null)
    .sort((x, y) => x.m.startedAt - y.m.startedAt);
  const afterWin = { w: 0, l: 0 };
  const afterLoss = { w: 0, l: 0 };
  const early = { w: 0, l: 0 };
  const late = { w: 0, l: 0 };
  let sessionsN = 0;
  let inRuns = 0;
  let run = 0;
  let prevEnd = -Infinity;
  let prevWin = false;
  games.forEach(({ m, p }) => {
    const win = p!.win;
    const fresh = m.startedAt - prevEnd > SESSION_GAP_MS;
    if (fresh) {
      if (run > 1) inRuns += run;
      sessionsN++;
      run = 0;
    } else {
      add(prevWin ? afterWin : afterLoss, win);
    }
    run++;
    add(run <= 3 ? early : late, win);
    prevEnd = m.startedAt + m.duration * 1000;
    prevWin = win;
  });
  if (run > 1) inRuns += run;
  return { games: games.length, sessions: sessionsN, inRuns, afterResult: split(afterWin, afterLoss), early: split(early, late) };
}
