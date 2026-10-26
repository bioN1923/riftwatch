/**
 * Sliding-window limiter covering several windows at once. Default values match a
 * Riot development key (20 req / 1 s and 100 req / 120 s). Requests wait in line
 * instead of failing, so a burst of match lookups is smoothed out automatically.
 * Limits are tracked per routing host because Riot applies them per region.
 */
interface Window {
  limit: number;
  ms: number;
}

export class RateLimiter {
  private hits = new Map<string, number[]>();
  private chains = new Map<string, Promise<void>>();

  constructor(private windows: Window[]) {}

  /** Replace the limits, e.g. after reading the key's real limits from Riot's headers. */
  setWindows(windows: Window[]) {
    if (windows.length) this.windows = windows;
  }

  describe() {
    return this.windows.map((w) => `${w.limit}/${w.ms / 1000}s`).join(', ');
  }

  schedule(host: string): Promise<void> {
    const prev = this.chains.get(host) ?? Promise.resolve();
    const next = prev.then(() => this.waitForSlot(host));
    this.chains.set(host, next.catch(() => undefined));
    return next;
  }

  private async waitForSlot(host: string) {
    for (;;) {
      const now = Date.now();
      const longest = Math.max(...this.windows.map((w) => w.ms));
      const list = (this.hits.get(host) ?? []).filter((t) => now - t < longest);
      this.hits.set(host, list);

      let waitMs = 0;
      for (const w of this.windows) {
        const inWindow = list.filter((t) => now - t < w.ms);
        if (inWindow.length >= w.limit) {
          waitMs = Math.max(waitMs, w.ms - (now - inWindow[0]) + 5);
        }
      }
      if (waitMs === 0) {
        list.push(now);
        return;
      }
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}
