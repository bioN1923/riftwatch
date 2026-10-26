import { describe, expect, it } from 'vitest';
import { ladderLabel, ladderValue } from '../src/lib/ladder';
import { playerTags } from '../src/lib/tags';
import { overview } from '../src/lib/stats';
import { formatKda, kdaRatio, timeAgo } from '../src/lib/format';
import { mockMatches } from '../server/mock';

describe('ladder', () => {
  it('orders ranks on one scale', () => {
    expect(ladderValue({ tier: 'IRON', rank: 'IV', lp: 0 })).toBe(0);
    expect(ladderValue({ tier: 'GOLD', rank: 'II', lp: 50 })).toBe(3 * 400 + 200 + 50);
    expect(ladderValue({ tier: 'MASTER', rank: 'I', lp: 120 })).toBe(2920);
    expect(ladderLabel(1250)).toBe('G4');
  });
});

describe('formatting', () => {
  it('handles perfect KDA', () => {
    expect(formatKda(kdaRatio(5, 0, 3))).toBe('Perfect');
    expect(formatKda(kdaRatio(5, 2, 3))).toBe('4.00');
  });
  it('describes relative times', () => {
    const now = Date.now();
    expect(timeAgo(now - 30_000, now)).toBe('just now');
    expect(timeAgo(now - 3 * 3600_000, now)).toBe('3 hours ago');
  });
});

describe('player summaries', () => {
  const name = { gameName: 'TagTester', tagLine: 'T1' };
  const { matches } = mockMatches(name, 0, 20, {});
  const puuid = `demo-${Buffer.from('TagTester#T1').toString('base64url')}`;

  it('aggregates wins, losses and champions excluding remakes', () => {
    const ov = overview(matches, puuid);
    expect(ov.games).toBe(matches.filter((m) => !m.remake).length);
    expect(ov.wins + ov.losses).toBe(ov.games);
    expect(ov.champions.reduce((s, c) => s + c.games, 0)).toBe(ov.games);
  });

  it('only claims a streak it can see', () => {
    const tags = playerTags({ matches, puuid, champName: () => 'X' });
    const streak = tags.find((t) => t.id === 'wstreak' || t.id === 'lstreak');
    if (streak) {
      const n = Number(streak.label.split(' ')[0]);
      expect(n).toBeGreaterThanOrEqual(3);
    }
    // Riot policy: no tags that shame a player.
    for (const t of tags) expect(['good', 'neutral']).toContain(t.tone);
  });
});
