import type { Platform } from '../shared/regions';
import type { RiotClient } from './riot';
import type { ChampionStatsStore } from './champStats';
import { shapeMatch, shapeTimeline } from './shape';

/**
 * Background match collector for champion stats. It walks the Challenger and Grandmaster
 * ladders, pulling each player's recent ranked games plus timelines, and some ARAM and Arena games. It paces itself well
 * under the key's limit and pauses whenever someone is using the site, so page loads
 * always come first.
 */
export function startCrawler(opts: { riot: RiotClient; platform: Platform; stats: ChampionStatsStore; lastUserRequest: () => number; paceMs: number; onStop?: (message: string) => void }) {
  // Never take the last half of the key's budget: visitors' lookups come first.
  const { riot, platform, stats } = opts;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const seenPlayers = new Set<string>();
  let collected = 0;

  async function paced<T>(fn: () => Promise<T>): Promise<T> {
    while (Date.now() - opts.lastUserRequest() < 8000 || riot.headroom(platform.regional) < 0.5 || riot.headroom(platform.id) < 0.5) await sleep(2000);
    await sleep(opts.paceMs);
    return fn();
  }

  async function loop() {
    stats.collecting = true;
    console.log(`Collecting ranked matches from ${platform.label} for champion stats (one request every ${opts.paceMs / 1000}s).`);
    for (;;) {
      try {
        const leagues = await Promise.all((['challenger', 'grandmaster'] as const).map((t) => paced(() => riot.apexLeague(platform, t)).catch(() => null)));
        const puuids: string[] = leagues.flatMap((l) => (l?.entries ?? []).map((e: any) => e.puuid).filter(Boolean));
        if (!puuids.length) {
          await sleep(10 * 60_000);
          continue;
        }
        for (const puuid of puuids.sort(() => Math.random() - 0.5)) {
          if (seenPlayers.has(puuid) && Math.random() < 0.7) continue;
          seenPlayers.add(puuid);
          const ids = await paced(() => riot.matchIds(platform, puuid, 0, 10, { queue: 420 })).catch(() => [] as string[]);
          // Every third player or so, also take their recent ARAM and Arena games (no timelines needed).
          if (Math.random() < 0.35) {
            for (const queue of [450, 1700]) {
              const extra = await paced(() => riot.matchIds(platform, puuid, 0, 5, { queue })).catch(() => [] as string[]);
              for (const id of extra) {
                if (stats.has(id)) continue;
                try {
                  stats.addMatch(shapeMatch(await paced(() => riot.match(platform, id, false))));
                } catch (e) {
                  if ((e as any)?.code === 'KEY_INVALID') throw e;
                }
              }
            }
          }
          for (const id of ids) {
            if (stats.has(id) && stats.hasTimeline(id)) continue;
            try {
              const raw = await paced(() => riot.match(platform, id, false));
              const m = shapeMatch(raw);
              stats.addMatch(m);
              const tl = await paced(() => riot.timeline(platform, id));
              stats.addTimeline(m, shapeTimeline(tl, raw.info.participants.map((x: any) => x.puuid)));
              if (++collected % 50 === 0) console.log(`Champion stats: ${collected} matches collected this session.`);
            } catch (e) {
              if ((e as any)?.code === 'KEY_INVALID') throw e;
            }
          }
        }
      } catch (e) {
        if ((e as any)?.code === 'KEY_INVALID') {
          console.warn('Match collector stopped: the Riot API key was rejected.');
          opts.onStop?.('The champion stats collector stopped: Riot rejected the API key (development keys expire every 24 hours).');
          stats.collecting = false;
          return;
        }
        await sleep(60_000);
      }
    }
  }
  void loop();
}
