import type { TimelineEvent } from '../../shared/types';

type Kill = Extract<TimelineEvent, { type: 'kill' }>;
type Objective = Extract<TimelineEvent, { type: 'objective' }>;

/** Summoner's Rift is about 14,870 units across (both axes). */
export const MAP_SIZE = 14870;

/** Where the epic monsters live, for objectives saved before Riot's positions were kept. */
const PITS: Record<string, [number, number]> = {
  DRAGON: [9866, 4414],
  ELDER_DRAGON: [9866, 4414],
  BARON_NASHOR: [5007, 10471],
  RIFTHERALD: [5007, 10471],
  HORDE: [5007, 10471],
  ATAKHAN: [7000, 7300],
};
export const objectivePos = (e: Objective): [number, number] | null =>
  e.x != null && e.y != null && (e.x || e.y) ? [e.x, e.y] : (PITS[e.monster] ?? null);

export interface MultiKill {
  killer: number;
  count: number; // 2..5
  t: number; // time of the last kill in the streak
  x: number;
  y: number;
}

/**
 * Multi-kills from the kill feed, with League's rule: each kill within 10 s of the previous one
 * (30 s for the fifth). Kills by minions or towers (killer < 0) don't count.
 */
export function multiKills(events: TimelineEvent[]): MultiKill[] {
  const byKiller = new Map<number, Kill[]>();
  for (const e of events) if (e.type === 'kill' && e.killer >= 0) byKiller.set(e.killer, [...(byKiller.get(e.killer) ?? []), e]);
  const out: MultiKill[] = [];
  for (const [killer, kills] of byKiller) {
    kills.sort((a, b) => a.t - b.t);
    let run: Kill[] = [];
    const flush = () => {
      if (run.length >= 2) {
        const last = run[run.length - 1];
        out.push({ killer, count: Math.min(5, run.length), t: last.t, x: last.x, y: last.y });
      }
    };
    for (const k of kills) {
      const prev = run[run.length - 1];
      const window = run.length === 4 ? 30 : 10;
      if (prev && k.t - prev.t <= window && run.length < 5) run.push(k);
      else {
        flush();
        run = [k];
      }
    }
    flush();
  }
  return out.sort((a, b) => a.t - b.t);
}

export type MapHappening = { kind: 'kill'; e: Kill } | { kind: 'objective'; e: Objective } | { kind: 'multi'; e: MultiKill };

/**
 * Everything that happened around a moment on the map: kills, epic monsters and multi-kills within
 * `seconds` and `radius` map units of the clicked spot, in time order. This is what a click on a
 * map dot shows: "Ahri killed Zed", "Lee Sin took the Infernal Drake", "Ahri: Triple kill".
 */
export function happeningsNear(events: TimelineEvent[], at: { t: number; x: number; y: number }, seconds = 20, radius = 2200): MapHappening[] {
  const near = (t: number, x: number, y: number) => Math.abs(t - at.t) <= seconds && Math.hypot(x - at.x, y - at.y) <= radius;
  const out: MapHappening[] = [];
  for (const e of events) {
    if (e.type === 'kill' && near(e.t, e.x, e.y)) out.push({ kind: 'kill', e });
    if (e.type === 'objective') {
      const p = objectivePos(e);
      if (p && near(e.t, p[0], p[1])) out.push({ kind: 'objective', e });
    }
  }
  for (const m of multiKills(events)) if (near(m.t, m.x, m.y)) out.push({ kind: 'multi', e: m });
  return out.sort((a, b) => a.e.t - b.e.t || (a.kind === 'multi' ? 1 : 0) - (b.kind === 'multi' ? 1 : 0));
}

/**
 * The same list as happeningsNear, for a given set of events (a whole fight and what was taken
 * after it), wherever on the map they happened, plus the multi-kills scored during it.
 */
export function happeningsOf(events: TimelineEvent[], only: TimelineEvent[]): MapHappening[] {
  const set = new Set(only);
  const out: MapHappening[] = [];
  for (const e of events) {
    if (!set.has(e)) continue;
    if (e.type === 'kill') out.push({ kind: 'kill', e });
    else if (e.type === 'objective') out.push({ kind: 'objective', e });
  }
  const kills = only.filter((e): e is Kill => e.type === 'kill');
  if (kills.length) {
    const from = Math.min(...kills.map((k) => k.t));
    const to = Math.max(...kills.map((k) => k.t));
    const killers = new Set(kills.map((k) => k.killer));
    for (const m of multiKills(events)) if (m.t >= from && m.t <= to && killers.has(m.killer)) out.push({ kind: 'multi', e: m });
  }
  return out.sort((a, b) => a.e.t - b.e.t || (a.kind === 'multi' ? 1 : 0) - (b.kind === 'multi' ? 1 : 0));
}
