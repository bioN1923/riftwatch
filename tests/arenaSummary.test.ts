import { describe, expect, it } from 'vitest';
import { arenaSummary } from '../src/lib/arenaSummary';
import type { MatchSummary } from '../shared/types';

const game = (placement: number, championId: number, augments: number[], extra: Partial<MatchSummary> = {}): MatchSummary =>
  ({ id: String(Math.random()), queueId: 1750, gameMode: 'CHERRY', remake: false, participants: [{ puuid: 'me', placement, championId, augments }, { puuid: 'x', placement: 1, championId: 1 }], ...extra }) as unknown as MatchSummary;

describe('arenaSummary', () => {
  it('is null without Arena games', () => {
    expect(arenaSummary([{ ...game(1, 1, []), queueId: 420, gameMode: 'CLASSIC' } as MatchSummary], 'me')).toBeNull();
  });
  it('counts places, top four, champions and augment picks', () => {
    const s = arenaSummary([game(1, 10, [5, 6]), game(3, 10, [5]), game(6, 20, [7]), game(2, 20, [], { remake: true })], 'me')!;
    expect(s.games).toBe(3);
    expect(s.avgPlacement).toBeCloseTo(10 / 3);
    expect(s.top4).toBe(2);
    expect(s.firsts).toBe(1);
    expect(s.placements).toEqual([1, 0, 1, 0, 0, 1, 0, 0]);
    expect(s.champions).toEqual([
      { championId: 10, games: 2, avgPlacement: 2, top4: 2 },
      { championId: 20, games: 1, avgPlacement: 6, top4: 0 },
    ]);
    expect(s.augments).toEqual([{ id: 5, picks: 2 }, { id: 6, picks: 1 }, { id: 7, picks: 1 }]);
  });
});
