/**
 * Requests started before the static data arrives (a page opened cold from a link). The page can't yet map
 * "ahri" to its numeric key, but the server accepts slugs, so it asks by slug in parallel with the static
 * data. The view then takes the promise once instead of fetching again; unused ones expire after 30 s.
 */
const pending = new Map<string, Promise<unknown>>();

export function startEarly<T>(key: string, fetcher: () => Promise<T>) {
  if (pending.has(key)) return;
  pending.set(key, fetcher().catch(() => undefined));
  setTimeout(() => pending.delete(key), 30_000);
}

/** The early result for `key` if one was started (and succeeded); otherwise `fallback()`. */
export async function takeEarly<T>(key: string, fallback: () => Promise<T>): Promise<T> {
  const started = pending.get(key) as Promise<T | undefined> | undefined;
  if (started) {
    pending.delete(key);
    const got = await started;
    if (got !== undefined) return got;
  }
  return fallback();
}

/** Plain URL slugs only ("ahri", "missfortune"); nicknames and typos go through the page's own resolver. */
export const plainSlug = (s: string) => /^[a-z0-9]+$/.test(s);

/** Key for champion stats started early by slug (champion page and lane draft helper). */
export const championEarlyKey = (slug: string, group: string, role?: string, patch?: string) => `champion|${slug}|${group}|${role ?? ''}|${patch ?? ''}`;
