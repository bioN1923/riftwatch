import { describe, expect, it } from 'vitest';
import { poolRead } from '../src/lib/playstyle';

describe('poolRead', () => {
  it('needs ten games', () => expect(poolRead([1, 1, 1, 1, 1])).toBeNull());
  it('spots a one-trick', () => expect(poolRead([7, 7, 7, 7, 7, 7, 7, 1, 2, 3])).toEqual({ kind: 'oneTrick', championId: 7, games: 7, total: 10 }));
  it('spots a wide pool', () => expect(poolRead([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2])).toEqual({ kind: 'wide', champions: 10, total: 12 }));
  it('says nothing in between', () => expect(poolRead([1, 1, 1, 1, 2, 2, 2, 3, 3, 4])).toBeNull());
});
