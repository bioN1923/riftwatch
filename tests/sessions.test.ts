import { describe, expect, it } from 'vitest';
import type { MatchSummary } from '../shared/types';
import { sessions, split } from '../src/lib/sessions';

const H = 3600_000;
// Each game lasts 30 minutes; `at` is the start in hours.
const game = (at: number, win: boolean, remake = false) =>
  ({ id: String(at), startedAt: at * H, duration: 1800, remake, participants: [{ puuid: 'me', win }] }) as unknown as MatchSummary;

describe('sessions', () => {
  it('splits sittings on an hour-long break and pairs each game with the one before', () => {
    // Sitting 1: W L L (gaps 5 min). Sitting 2, next day: W W.
    const ms = [game(0, true), game(0.6, false), game(1.2, false), game(24, true), game(24.6, true)];
    const s = sessions(ms, 'me');
    expect(s.sessions).toBe(2);
    expect(s.inRuns).toBe(5);
    // Not enough games on each side to compare.
    expect(s.afterResult).toBeNull();
  });
  it('compares after-win and after-loss once both have enough games', () => {
    const ms: MatchSummary[] = [];
    let at = 0;
    // Ten sittings of W then L, then L then L: after a win → loss, after a loss → loss.
    for (let d = 0; d < 6; d++) {
      for (const w of [true, false, false]) ms.push(game((at += 0.6), w));
      at += 30;
    }
    const s = sessions(ms, 'me');
    expect(s.afterResult?.a).toEqual({ w: 0, l: 6 });
    expect(s.afterResult?.b).toEqual({ w: 0, l: 6 });
    expect(s.afterResult?.verdict).toBe('same');
  });
  it('ignores remakes', () => {
    expect(sessions([game(0, true, true)], 'me').games).toBe(0);
  });
});

describe('split', () => {
  it('calls clear gaps sure and small ones the same', () => {
    expect(split({ w: 18, l: 2 }, { w: 4, l: 16 })?.verdict).toBe('sure');
    expect(split({ w: 4, l: 2 }, { w: 2, l: 4 })?.verdict).toBe('leaning');
    // A big gap on few games is only a lean.
    expect(split({ w: 6, l: 2 }, { w: 1, l: 5 })?.verdict).toBe('leaning');
    expect(split({ w: 5, l: 5 }, { w: 5, l: 6 })?.verdict).toBe('same');
    expect(split({ w: 1, l: 2 }, { w: 5, l: 5 })).toBeNull();
  });
});
