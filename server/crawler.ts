import type { Platform } from '../shared/regions';
import type { RiotClient } from './riot';
import type { ChampionStatsStore } from './champStats';
import { shapeMatch, shapeTimeline } from './shape';
import { arenaQueue, isArena, isArenaMatch } from '../shared/queues';
import type { ArenaSeeds } from './arenaSeeds';
import { findArenaPlayer, probeStatus, PROBE_EVERY_MS } from './arenaProbe';

/**
 * Background match collector for champion stats. It walks the Challenger, Grandmaster and
 * Master ladders, pulling the new ranked games (plus timelines) of players who have played since
 * its last visit, and some ARAM and Arena games. It paces itself well
 * under the key's limit and pauses whenever someone is using the site, so page loads
 * always come first.
 */
/** Lined-up Arena players read per quiet spell of the ladder (instead of resting). */
export const ARENA_QUIET_BATCH = 10;
/** ARAM players read from the ARAM line in a quiet pass (nobody on the ladder has played since the last one). */
export const ARAM_QUIET_BATCH = 5;
/** While the ladder is busy, read one lined-up ARAM player at least this often (about 6 paced requests, ~1/4 of the budget). */
export const ARAM_EVERY_MS = 60_000;

/** ARAM line reads since the server started: players read, and new ARAM games they gave (shown on /api/health). */
export const aramLine = { reads: 0, added: 0 };

export function startCrawler(opts: { riot: RiotClient; platform: Platform; stats: ChampionStatsStore; lastUserRequest: () => number; paceMs: number; onStop?: (message: string) => void; arenaSeeds?: ArenaSeeds; aramSeeds?: ArenaSeeds }) {
  // Never take the last half of the key's budget: visitors' lookups come first.
  const { riot, platform, stats } = opts;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  /** Each ladder player's ranked game count when last visited; unchanged means nothing new to fetch. */
  const lastPlayed = new Map<string, number>();
  let collected = 0;
  let lastProbe = 0;

  async function paced<T>(fn: () => Promise<T>): Promise<T> {
    while (Date.now() - opts.lastUserRequest() < 8000 || riot.headroom(platform.regional) < 0.5 || riot.headroom(platform.id) < 0.5) await sleep(2000);
    await sleep(opts.paceMs);
    return fn();
  }

  /** Re-reads up to n older games for their lane leads; returns how many it tried. */
  async function backfill(n: number) {
    const ids = stats.laneBackfill(n);
    for (const id of ids) {
      try {
        const raw = await paced(() => riot.match(platform, id, false));
        const tl = await paced(() => riot.timeline(platform, id));
        stats.addLane(shapeMatch(raw), shapeTimeline(tl, raw.info.participants.map((x: any) => x.puuid)));
      } catch (e) {
        if ((e as any)?.code === 'KEY_INVALID') throw e;
        if ((e as any)?.code === 'NOT_FOUND') stats.skipLane(id);
      }
    }
    return ids.length;
  }

  /** A player's last few games in one queue, without timelines; Arena games line up their players. */
  async function readQueue(puuid: string, queue: number) {
    if (queue === 450) aramLine.reads++;
    let ids = await paced(() => riot.matchIds(platform, puuid, 0, 5, { queue })).catch(() => [] as string[]);
    // A lined-up Arena player with no games in the queue we asked for: Arena may be running under an
    // event queue id we haven't learned yet (or forgot on a restart). Read their latest games of any
    // queue instead; an Arena one teaches the id (shapeMatch) and lines up its players.
    if (!ids.length && isArena(queue)) ids = await paced(() => riot.matchIds(platform, puuid, 0, 3, {})).catch(() => [] as string[]);
    for (const id of ids) {
      if (stats.has(id)) continue;
      try {
        const m = shapeMatch(await paced(() => riot.match(platform, id, false)));
        stats.addMatch(m);
        if (m.queueId === 450) aramLine.added++;
        opts.arenaSeeds?.note(m);
        opts.aramSeeds?.note(m);
      } catch (e) {
        if ((e as any)?.code === 'KEY_INVALID') throw e;
      }
    }
  }

  /** Read up to `n` lined-up Arena players' latest Arena games (each one paced like everything else). */
  async function readArenaLine(n: number) {
    for (let i = 0; i < n; i++) {
      const seed = opts.arenaSeeds?.take();
      if (!seed) return;
      await readQueue(seed, arenaQueue());
    }
  }

  /** Nobody lined up for Arena: look for a first Arena player in an everyday tier to start the chain. */
  async function maybeProbe() {
    if (!opts.arenaSeeds || opts.arenaSeeds.size > 0 || Date.now() - lastProbe < PROBE_EVERY_MS) return;
    lastProbe = Date.now();
    probeStatus.runs++;
    probeStatus.lastAt = lastProbe;
    const found = await findArenaPlayer({
      page: (tier, division, page) => paced(() => riot.leaguePage(platform, tier, division, page)),
      arenaIds: (puuid) => paced(() => riot.matchIds(platform, puuid, 0, 3, { queue: arenaQueue() })),
      recentArena: async (puuid) => {
        const ids = await paced(() => riot.matchIds(platform, puuid, 0, 3, {}));
        for (const id of ids) {
          if (stats.has(id)) continue;
          const m = shapeMatch(await paced(() => riot.match(platform, id, false))); // learns a new Arena queue id
          stats.addMatch(m);
          if (isArenaMatch(m)) return true;
        }
        return false;
      },
    });
    console.log(found ? 'Arena: found a player with recent Arena games; following their games.' : 'Arena: no recent Arena games among the players asked; trying again later.');
    if (found) {
      probeStatus.found++;
      await readQueue(found, arenaQueue());
    }
  }

  let lastAramRead = 0;

  async function loop() {
    stats.collecting = true;
    console.log(`Collecting ranked matches from ${platform.label} for champion stats (one request every ${opts.paceMs / 1000}s).`);
    for (;;) {
      try {
        const leagues = await Promise.all((['challenger', 'grandmaster', 'master'] as const).map((t) => paced(() => riot.apexLeague(platform, t)).catch(() => null)));
        // Ranked games played so far, straight from the league entries (wins + losses).
        const played = new Map<string, number>();
        for (const l of leagues) for (const e of l?.entries ?? []) if (e.puuid) played.set(e.puuid, (e.wins ?? 0) + (e.losses ?? 0));
        if (!played.size) {
          await sleep(10 * 60_000);
          continue;
        }
        let active = 0;
        for (const puuid of [...played.keys()].sort(() => Math.random() - 0.5)) {
          // Only players who have played since the last visit: their game count is free to check
          // (it came with the league), so the budget goes to new games instead of re-reading old ones.
          const now = played.get(puuid)!;
          const before = lastPlayed.get(puuid);
          lastPlayed.set(puuid, now);
          if (before != null && now <= before) continue;
          active++;
          const count = before == null ? 10 : Math.min(10, now - before);
          const ids = await paced(() => riot.matchIds(platform, puuid, 0, count, { queue: 420 })).catch(() => [] as string[]);
          // ARAM on a clock rather than by chance: a ranked player can take a minute of paced requests
          // (a timeline per game), so a per-player chance read the line only a few times an hour after a
          // restart. Apex players rarely play ARAM, so this asks a player lined up from an ARAM game already
          // read (ARAM players lead to more ARAM players, as with Arena); each read gives about 5 new games.
          if (Date.now() - lastAramRead >= ARAM_EVERY_MS) {
            lastAramRead = Date.now();
            await readQueue(opts.aramSeeds?.take() ?? puuid, 450);
          }
          // Arena comes from Arena players instead: the next one lined up from an Arena game already read.
          if (opts.arenaSeeds?.size) await readArenaLine(1);
          else await maybeProbe();
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
          // Then a few older games whose timelines predate the lane curves (newest first), until none are left.
          await backfill(4);
        }
        // Nobody on the ladder has played since the last pass (league data refreshes every 10
        // minutes): spend the quiet time on the lane-curve backfill, or rest if that's done too.
        if (!active) {
          // The Arena list shouldn't wait for the ladder to wake up: read some of the line, or search.
          if (opts.arenaSeeds?.size) await readArenaLine(ARENA_QUIET_BATCH);
          else await maybeProbe();
          // Nor ARAM: this time would otherwise only go to the backfill, so ranked loses nothing.
          for (let i = 0; i < ARAM_QUIET_BATCH; i++) {
            const seed = opts.aramSeeds?.take();
            if (!seed) break;
            await readQueue(seed, 450);
          }
          if (!(await backfill(20))) await sleep(2 * 60_000);
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
