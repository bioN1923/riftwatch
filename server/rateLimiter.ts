/**
 * Sliding-window limiter covering several windows at once. Default values match a
 * Riot development key (20 req / 1 s and 100 req / 120 s). Requests wait in line
 * instead of failing, so a burst of match lookups is smoothed out automatically.
 *
 * Limits are tracked per key: the routing host for Riot's application limits (Riot applies
 * them per region), or host + endpoint for its per-method limits. A key can also be paused,
 * e.g. for the Retry-After time of a 429, and every request queued on it waits.
 */
interface Window {
  limit: number;
  ms: number;
}

export class RateLimiter {
  private hits = new Map<string, number[]>();
  private chains = new Map<string, Promise<void>>();
  private keyWindows = new Map<string, Window[]>();
  private pausedUntil = new Map<string, number>();

  /** With no default windows, keys without their own limits pass straight through. */
  constructor(private windows: Window[]) {}

  /** Replace the limits (for one key, or the default), e.g. after reading Riot's headers. */
  setWindows(windows: Window[], key?: string) {
    if (!windows.length) return;
    if (key) this.keyWindows.set(key, windows);
    else this.windows = windows;
  }

  describe(key?: string) {
    return (key ? (this.keyWindows.get(key) ?? this.windows) : this.windows).map((w) => `${w.limit}/${w.ms / 1000}s`).join(', ');
  }

  /** Hold every request on this key until `ms` from now (never shortens an existing pause). */
  pause(key: string, ms: number) {
    const until = Date.now() + ms;
    if (until > (this.pausedUntil.get(key) ?? 0)) this.pausedUntil.set(key, until);
  }

  /** Share of the tightest window still free for this key (1 = idle, 0 = full or paused). */
  headroom(key: string) {
    if (this.pausedFor(key) > 0) return 0;
    const windows = this.keyWindows.get(key) ?? this.windows;
    if (!windows.length) return 1;
    const now = Date.now();
    const list = this.hits.get(key) ?? [];
    return Math.min(...windows.map((w) => Math.max(0, w.limit - list.filter((t) => now - t < w.ms).length) / w.limit));
  }

  pausedFor(key: string) {
    return Math.max(0, (this.pausedUntil.get(key) ?? 0) - Date.now());
  }

  schedule(key: string): Promise<void> {
    const prev = this.chains.get(key) ?? Promise.resolve();
    const next = prev.then(() => this.waitForSlot(key));
    this.chains.set(key, next.catch(() => undefined));
    return next;
  }

  private async waitForSlot(key: string) {
    for (;;) {
      const now = Date.now();
      const windows = this.keyWindows.get(key) ?? this.windows;
      let waitMs = this.pausedFor(key);
      const list = this.hits.get(key) ?? [];
      if (windows.length) {
        const longest = Math.max(...windows.map((w) => w.ms));
        const recent = list.filter((t) => now - t < longest);
        this.hits.set(key, recent);
        for (const w of windows) {
          const inWindow = recent.filter((t) => now - t < w.ms);
          if (inWindow.length >= w.limit) waitMs = Math.max(waitMs, w.ms - (now - inWindow[0]) + 5);
        }
      }
      if (waitMs === 0) {
        if (windows.length) this.hits.get(key)!.push(now);
        return;
      }
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

/** Riot's limit headers look like "20:1,100:120" (count:seconds). Kept at 90% for headroom. */
export function parseLimitHeader(header: string | null): Window[] {
  if (!header) return [];
  return header
    .split(',')
    .map((part) => part.split(':').map(Number))
    .filter(([limit, secs]) => limit > 0 && secs > 0)
    .map(([limit, secs]) => ({ limit: Math.max(1, Math.floor(limit * 0.9)), ms: secs * 1000 }));
}

/** Exponential backoff with jitter: ~1 s, 2 s, 4 s … capped. */
export function backoffMs(attempt: number, baseMs = 1000, capMs = 16_000) {
  return Math.min(capMs, baseMs * 2 ** attempt) + Math.floor(Math.random() * 250);
}
