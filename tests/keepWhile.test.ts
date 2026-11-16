import { describe, expect, it } from 'vitest';
import { keepWhile } from '../src/lib/keepWhile';

describe('keepWhile', () => {
  it('keeps data when the subject parts match', () => {
    const f = keepWhile(['matchup', 1, 2, 'TOP'], 1, 2);
    expect(f('old', { queryKey: ['matchup', 1, 2, 'MIDDLE'] })).toBe('old');
    expect(f('old', { queryKey: ['matchup', 1, 3, 'TOP'] })).toBeUndefined();
    expect(f(undefined, undefined)).toBeUndefined();
  });
});
