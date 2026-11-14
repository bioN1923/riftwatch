import { describe, expect, it } from 'vitest';
import type { MatchSummary } from '../shared/types';
import { winConditions } from '../src/lib/winConditions';

const game = (win: boolean, deaths: number, i: number) =>
  ({
    remake: false,
    duration: 1800,
    participants: [
      { puuid: 'me', teamId: 100, win, deaths, cs: 200 + (i % 3), killParticipation: 0.5, visionScore: 30, damage: 20000, extra: { firstBlood: false } },
      { puuid: 'mate', teamId: 100, win, deaths: 3, cs: 0, killParticipation: 0.5, visionScore: 0, damage: 20000, extra: {} },
    ],
  }) as unknown as MatchSummary;

describe('winConditions', () => {
  it('finds that the player wins when they die little', () => {
    const ms = [
      ...Array.from({ length: 6 }, (_, i) => game(true, 2, i)),
      game(false, 3, 0),
      ...Array.from({ length: 6 }, (_, i) => game(false, 9, i)),
      game(true, 8, 0),
    ];
    const c = winConditions(ms, 'me');
    const d = c.find((x) => x.metric === 'deaths')!;
    expect(d).toMatchObject({ at: 6, when: { w: 6, l: 1 }, otherwise: { w: 1, l: 6 }, sure: true });
    expect(c[0].metric).toBe('deaths');
  });
  it('says nothing when there are too few games or no real gap', () => {
    expect(winConditions([game(true, 1, 0), game(false, 9, 1)], 'me')).toEqual([]);
    const even = Array.from({ length: 12 }, (_, i) => game(i % 2 === 0, i % 4 < 2 ? 2 : 8, i));
    expect(winConditions(even, 'me').find((x) => x.metric === 'deaths')).toBeUndefined();
  });
});
