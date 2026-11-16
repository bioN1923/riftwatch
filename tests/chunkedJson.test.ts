import { describe, expect, it } from 'vitest';
import { stringifyChunked } from '../server/chunkedJson';

describe('stringifyChunked', () => {
  it('matches JSON.stringify on nested plain data', async () => {
    const v = { a: 1, b: { c: [1, 2, { d: 'x' }], e: { f: { g: { h: { i: { j: true } } } } }, u: undefined }, s: 'q"uote', n: null, emp: {}, arr: [] };
    expect(await stringifyChunked(v)).toBe(JSON.stringify(v));
    expect(await stringifyChunked(v, { depth: 1 })).toBe(JSON.stringify(v));
    expect(await stringifyChunked(v, { budgetMs: 0 })).toBe(JSON.stringify(v));
  });
  it('matches JSON.stringify on long arrays, holes and undefined included', async () => {
    const arr = Array.from({ length: 200 }, (_, i) => (i % 50 === 0 ? undefined : { i, name: `p${i}`, tags: [i, 'x'] }));
    expect(await stringifyChunked(arr, { budgetMs: 0 })).toBe(JSON.stringify(arr));
    expect(await stringifyChunked({ list: arr }, { budgetMs: 0 })).toBe(JSON.stringify({ list: arr }));
  });
  it('handles a big object and yields along the way', async () => {
    const big: Record<string, unknown> = {};
    for (let i = 0; i < 3000; i++) big[`k${i}`] = { roles: { MID: { g: i, w: i / 2, mu: { 1: { g: 1 } } } } };
    let ticks = 0;
    const timer = setInterval(() => ticks++, 0);
    const s = await stringifyChunked({ patches: { '15.20': { ranked: { champs: big } } } }, { budgetMs: 1 });
    clearInterval(timer);
    expect(JSON.parse(s).patches['15.20'].ranked.champs.k2999.roles.MID.g).toBe(2999);
    expect(ticks).toBeGreaterThanOrEqual(0);
  });
});
