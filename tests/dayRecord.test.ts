import { describe, expect, it } from 'vitest';
import type { MatchSummary } from '../shared/types';
import { dayRecord } from '../src/components/profile/Sidebar';

const game = (win: boolean, remake = false) => ({ remake, duration: 1800, participants: [{ puuid: 'me', win }] }) as unknown as MatchSummary;

describe('dayRecord', () => {
  it('counts the run of results at the end of the day (newest first), skipping remakes', () => {
    const r = dayRecord([game(false), game(false, true), game(false), game(false), game(true), game(false)], 'me');
    expect(r).toMatchObject({ w: 1, l: 4, end: { r: 'loss', n: 3 }, played: 6 * 1800 });
  });
  it('has no run for a day with no decided games', () => {
    expect(dayRecord([game(true, true)], 'me').end).toBeNull();
  });
});
