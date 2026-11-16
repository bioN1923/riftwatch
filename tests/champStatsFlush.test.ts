import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ChampionStatsStore } from '../server/champStats';
import { mockArenaMatch, mockMatches, mockTimeline } from '../server/mock';

describe('ChampionStatsStore.flushAsync', () => {
  it('writes the same data the blocking save would, and reloads', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-'));
    const a = path.join(dir, 'a.json');
    const b = path.join(dir, 'b.json');
    const sa = new ChampionStatsStore(a);
    const sb = new ChampionStatsStore(b);
    const games = [...mockMatches({ gameName: 'Caps', tagLine: 'EUW' }, 0, 20, {}).matches, mockArenaMatch(7)];
    for (const m of games) {
      for (const s of [sa, sb]) {
        s.addMatch(m);
        if (!m.remake && m.teams.length) s.addTimeline(m, mockTimeline(m));
      }
    }
    await sa.flushAsync();
    sb.flush();
    expect(fs.existsSync(`${a}.tmp`)).toBe(false);
    expect(JSON.parse(fs.readFileSync(a, 'utf8'))).toEqual(JSON.parse(fs.readFileSync(b, 'utf8')));
    const again = new ChampionStatsStore(a);
    expect(again.tierList('ranked').matches).toBe(sa.tierList('ranked').matches);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
