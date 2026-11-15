import { describe, expect, it } from 'vitest';
import { ladderPosition } from '../shared/ladderPosition';

const list = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => ({ puuid: `${prefix}${i}` }));

describe('ladderPosition', () => {
  const lists = { challenger: list('c', 300), grandmaster: list('g', 700), master: list('m', 4000) };
  it('counts the tiers above for the overall place', () => {
    expect(ladderPosition(lists, 'grandmaster', 'g56', 50)).toEqual({ tier: 'grandmaster', rank: 57, overall: 357, tierTotal: 700, page: 2 });
    expect(ladderPosition(lists, 'challenger', 'c0', 50)).toMatchObject({ rank: 1, overall: 1, page: 1 });
    expect(ladderPosition(lists, 'master', 'm9', 50)).toMatchObject({ rank: 10, overall: 1010 });
  });
  it('is null for someone not on that tier list', () => {
    expect(ladderPosition(lists, 'master', 'g1', 50)).toBeNull();
  });
});
