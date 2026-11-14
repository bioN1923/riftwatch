import { describe, expect, it } from 'vitest';
import { damageMix, damageType } from '../src/lib/damageMix';

describe('damageMix', () => {
  it('classifies champions by Riot’s attack/magic ratings', () => {
    expect(damageType([8, 2])).toBe('ad'); // a marksman
    expect(damageType([2, 9])).toBe('ap'); // a mage
    expect(damageType([6, 7])).toBe('mixed'); // a hybrid
    expect(damageType(undefined)).toBeNull();
  });
  it('flags a team leaning on one damage type', () => {
    expect(damageMix([[8, 2], [9, 1], [7, 3], [6, 6], [5, 5]])).toEqual({ ad: 3, ap: 0, mixed: 2, lean: 'ad' });
    expect(damageMix([[8, 2], [2, 9], [7, 3], [1, 8], [5, 5]])).toEqual({ ad: 2, ap: 2, mixed: 1, lean: null });
    expect(damageMix([[1, 9], [2, 9], [1, 8], [3, 8], [8, 2]])?.lean).toBe('ap');
    expect(damageMix([[8, 2], undefined])).toBeNull();
  });
});
