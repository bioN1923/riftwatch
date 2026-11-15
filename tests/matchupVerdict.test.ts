import { describe, expect, it } from 'vitest';
import { matchupCall, callTone } from '../src/lib/matchupVerdict';

describe('matchupCall', () => {
  it('needs ten games', () => expect(matchupCall({ games: 9, winRate: 0.8, adjusted: 0.6 })).toEqual({ side: 'few' }));
  it('calls small adjusted edges even', () => expect(matchupCall({ games: 113, winRate: 0.487, adjusted: 0.49 })).toEqual({ side: 'even' }));
  it('is sure only past two standard errors', () => {
    expect(matchupCall({ games: 2000, winRate: 0.54, adjusted: 0.539 })).toEqual({ side: 'me', sure: true });
    expect(matchupCall({ games: 120, winRate: 0.55, adjusted: 0.53 })).toEqual({ side: 'me', sure: false });
    expect(matchupCall({ games: 400, winRate: 0.44, adjusted: 0.45 })).toEqual({ side: 'them', sure: true });
  });
  it('colours only sure calls', () => {
    expect(callTone({ side: 'me', sure: false })).toBe('text-text');
    expect(callTone({ side: 'them', sure: true })).toBe('text-loss');
  });
});
