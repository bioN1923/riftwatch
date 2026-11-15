import { describe, expect, it } from 'vitest';
import { LadderHistory } from '../server/ladderHistory';

const H = 3600_000;
describe('LadderHistory', () => {
  it('snapshots at most hourly and compares with the one closest to a day old', () => {
    const h = new LadderHistory(null);
    const t0 = 1_000_000_000_000;
    h.record('euw1:solo:challenger', [{ puuid: 'a', lp: 1000 }], t0);
    h.record('euw1:solo:challenger', [{ puuid: 'a', lp: 1010 }], t0 + 0.5 * H); // too soon: ignored
    expect(h.baseline('euw1:solo:challenger', t0 + 0.5 * H)).toBeNull(); // under an hour old
    h.record('euw1:solo:challenger', [{ puuid: 'a', lp: 1100 }], t0 + 20 * H);
    const b = h.baseline('euw1:solo:challenger', t0 + 25 * H)!;
    expect(b.at).toBe(t0); // 25 h old beats 5 h old for "about a day"
    expect(b.lp.a).toBe(1000);
  });
  it('forgets snapshots after two days', () => {
    const h = new LadderHistory(null);
    h.record('k', [{ puuid: 'a', lp: 1 }], 0);
    expect(h.baseline('k', 49 * H)).toBeNull();
  });
});
