import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MatchStore } from '../server/matchStore';

describe('MatchStore prune', () => {
  it('drops the oldest files without blocking, down to 90% of the cap', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-ms-'));
    const store = new MatchStore(dir, 20);
    for (let i = 0; i < 21; i++) {
      store.set(`EUW1_${i}`, { i });
      await new Promise((r) => setTimeout(r, 5));
    }
    for (let k = 0; k < 50 && fs.readdirSync(dir).length > 18; k++) await new Promise((r) => setTimeout(r, 20));
    const left = fs.readdirSync(dir).filter((f) => f.endsWith('.json.gz'));
    expect(left.length).toBe(18);
    expect(store.size).toBe(18);
    expect(store.get('EUW1_20')).toEqual({ i: 20 });
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
