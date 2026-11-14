import { describe, expect, it } from 'vitest';
import type { TimelineEvent } from '../shared/types';
import { fights, turningPoints } from '../src/lib/turningPoints';

const side = [100, 100, 100, 100, 100, 200, 200, 200, 200, 200];
const kill = (t: number, killer: number, victim: number): TimelineEvent => ({ type: 'kill', t, killer, victim, assists: [], x: 0, y: 0 });

describe('fights', () => {
  it('chains kills that are close together', () => {
    const f = fights([kill(100, 0, 5), kill(110, 1, 6), kill(124, 5, 2), kill(200, 0, 7)]);
    expect(f.map((x) => x.length)).toEqual([3, 1]);
  });
});

describe('turningPoints', () => {
  it('finds first blood, the swing, the deciding fight and a comeback', () => {
    const events: TimelineEvent[] = [
      kill(30, -1, 3), // executed by minions: not first blood
      kill(200, 6, 1),
      kill(1500, 0, 5),
      kill(1505, 1, 6),
      kill(1510, 7, 2),
      kill(1512, 2, 8),
      { type: 'objective', t: 1550, teamId: 100, monster: 'BARON_NASHOR' },
      { type: 'building', t: 1600, teamId: 100, building: 'TOWER', lane: 'MID_LANE' },
    ];
    const diff = [0, -200, -800, -1500, -2600, -3000, -2400, -1000, 1200, 2500];
    const tp = turningPoints(events, diff, side, 100);
    expect(tp[0]).toEqual({ kind: 'firstBlood', t: 200, killer: 6, victim: 1 });
    expect(tp.find((x) => x.kind === 'swing')).toMatchObject({ team: 100, from: 6, to: 9, gold: 4900 });
    expect(tp.find((x) => x.kind === 'fight')).toMatchObject({ t: 1500, won: 3, lost: 1, towers: 1 });
    expect(tp.find((x) => x.kind === 'comeback')).toEqual({ kind: 'comeback', team: 100, gold: 3000, minute: 5 });
  });

  it('says when the winners led from early on', () => {
    const diff = [0, 300, 600, 900, 1000];
    const tp = turningPoints([], diff, side, 100);
    expect(tp).toEqual([{ kind: 'led', team: 100, minute: 1 }]);
  });

  it('skips a fight the winners lost or only traded', () => {
    const tp = turningPoints([kill(100, 5, 0), kill(105, 6, 1), kill(108, 0, 7)], [0, 0], side, 100);
    expect(tp.some((x) => x.kind === 'fight')).toBe(false);
  });
});
