import { describe, expect, it } from 'vitest';
import { instrument, perfSnapshot } from '../server/perf';

describe('perf', () => {
  it('times sync and async methods', async () => {
    const o = { busy() { const t = Date.now(); while (Date.now() - t < 20); return 1; }, async later() { await new Promise((r) => setTimeout(r, 10)); return 2; } };
    instrument(o, 'busy', 't.busy');
    instrument(o, 'later', 't.later');
    expect(o.busy()).toBe(1);
    expect(await o.later()).toBe(2);
    const s = perfSnapshot() as { spans: Record<string, { n: number; maxMs: number }> };
    expect(s.spans['t.busy'].n).toBe(1);
    expect(s.spans['t.busy'].maxMs).toBeGreaterThanOrEqual(19);
    expect(s.spans['t.later'].n).toBe(1);
  });
});
