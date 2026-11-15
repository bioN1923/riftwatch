import { describe, expect, it } from 'vitest';
import type { MatchSummary } from '../shared/types';
import { personalRecords } from '../src/lib/records';

const m = (id: string, at: number, p: Record<string, number>, extra: Partial<MatchSummary> = {}) =>
  ({
    id,
    queueId: 420,
    startedAt: at,
    duration: 1800,
    remake: false,
    participants: [{ puuid: 'me', win: true, kills: 0, deaths: 0, assists: 0, damage: 0, cs: 0, visionScore: 0, largestMultiKill: 1, ...p }],
    ...extra,
  }) as unknown as MatchSummary;

describe('personalRecords', () => {
  const list = [
    m('a', 1, { kills: 12, deaths: 3, assists: 4, damage: 30000, cs: 240, visionScore: 30, largestMultiKill: 3 }),
    m('b', 2, { kills: 12, deaths: 0, assists: 10, damage: 20000, cs: 150, visionScore: 60 }),
    m('c', 3, { kills: 30, deaths: 1, assists: 0, damage: 90000, cs: 400, largestMultiKill: 5 }, { remake: true }),
    m('d', 4, { kills: 25, damage: 99000, cs: 50 }, { queueId: 1710 }),
    m('e', 5, { kills: 2, cs: 200 }, { duration: 600 }),
  ];
  const r = Object.fromEntries(personalRecords(list, 'me').map((x) => [x.id, x.match.id]));
  it('picks the best game for each, newest on a tie', () => {
    expect(r.kills).toBe('b');
    expect(r.kda).toBe('b');
    expect(r.damage).toBe('a');
    expect(r.multi).toBe('a');
    expect(r.vision).toBe('b');
  });
  it('leaves out remakes, Arena and short games for per-minute records', () => {
    expect(r.cspm).toBe('a');
    expect(Object.values(r)).not.toContain('c');
    expect(Object.values(r)).not.toContain('d');
  });
});
