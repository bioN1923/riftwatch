import { describe, expect, it } from 'vitest';
import { compareCore, isLegendary, purchasedCore, type ItemInfo } from '../src/lib/buildCompare';

const items = new Map<number, ItemInfo>([
  [1001, { gold: 300, from: [], into: [3006] }],
  [3006, { gold: 1100, from: [1001], into: [3172] }],
  [3172, { gold: 2600, from: [3006], into: [] }], // tier-3 boots: not a core item
  [3031, { gold: 3400, from: [], into: [] }],
  [3094, { gold: 2600, from: [], into: [] }],
  [3036, { gold: 3000, from: [], into: [] }],
  [3072, { gold: 3200, from: [], into: [] }],
  [1037, { gold: 875, from: [], into: [3031] }],
]);
const leg = (id: number) => isLegendary(id, items);

describe('isLegendary', () => {
  it('counts finished 2000+ items, not components or boots', () => {
    expect(leg(3031)).toBe(true);
    expect(leg(1037)).toBe(false);
    expect(leg(3172)).toBe(false);
    expect(leg(9999)).toBe(false);
  });
});

describe('purchasedCore', () => {
  it('keeps purchase order and only items still owned', () => {
    const purchases = [{ itemId: 3094 }, { itemId: 3072 }, { itemId: 3072, sold: true }, { itemId: 3031 }, { itemId: 3036 }];
    // 3072 was bought then sold and is not in the final inventory.
    expect(purchasedCore([3031, 3094, 3036, 3172, 0, 0, 3340], purchases, leg)).toEqual([3094, 3031, 3036]);
  });
});

describe('compareCore', () => {
  const builds = [
    { ids: [3094, 3031, 3036], games: 200, winRate: 0.53 },
    { ids: [3031, 3072, 3036], games: 120, winRate: 0.5 },
  ];
  it('finds the same three items in any order', () => {
    expect(compareCore([3036, 3072, 3031], builds)).toMatchObject({ kind: 'same', rank: 2 });
  });
  it('reports shared items with the most played core otherwise', () => {
    expect(compareCore([3031, 3072, 6672], builds)).toMatchObject({ kind: 'differs', shared: [3031] });
  });
  it('waits for three items, and needs data', () => {
    expect(compareCore([3031], builds)).toEqual({ kind: 'short', have: 1 });
    expect(compareCore([3031, 3094, 3036], [])).toBeNull();
  });
});
