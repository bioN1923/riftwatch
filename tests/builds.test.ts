import { describe, expect, it } from 'vitest';
import { buildVariations } from '../server/champStats';

const c = (g: number, w: number) => ({ g, w });

describe('build variations', () => {
  it('lists the three most played builds and adds the best one, each with its own follow-ups', () => {
    const r: any = {
      core: { '1,2,3': c(100, 50), '1,2,4': c(60, 30), '1,3,5': c(40, 18), '2,3,6': c(30, 21), '7,8,9': c(1, 1) },
      bv: { '1,2,3': { boots: { '3020': c(80, 40) }, s4: { '10': c(70, 35) }, s5: {}, s6: {} } },
    };
    const b = buildVariations(r)!;
    expect(b.map((x) => x.ids.join())).toEqual(['1,2,3', '1,2,4', '1,3,5', '2,3,6']);
    expect(b[0].tags).toContain('popular');
    expect(b[3].tags).toContain('best'); // 70% over 30 games
    expect(b[0].boots[0]).toMatchObject({ id: 3020, games: 80 });
    expect(b[0].later.find((l) => l.slot === 4)?.options[0].id).toBe(10);
    expect(b[1].bootsTotal).toBe(0); // no per-build data yet → UI falls back to all builds
  });

  it('still shows up to three builds when there is little data', () => {
    const r: any = { core: { '1,2,3': c(2, 1), '4,5,6': c(1, 1) } };
    expect(buildVariations(r)!.length).toBe(2);
  });
});
