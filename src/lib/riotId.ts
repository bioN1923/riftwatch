/** Riot IDs look like "Name#TAG". In URLs we use "Name-TAG" (like u.gg); tags never contain "-". */

export interface RiotId {
  gameName: string;
  tagLine: string;
}

export function parseRiotId(input: string, fallbackTag: string): RiotId | null {
  const raw = input.trim().replace(/\s+/g, ' ');
  if (!raw) return null;
  const i = raw.lastIndexOf('#');
  const gameName = (i >= 0 ? raw.slice(0, i) : raw).trim();
  const tagLine = (i >= 0 ? raw.slice(i + 1) : fallbackTag).trim();
  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}

export function toSlug(id: RiotId) {
  return `${encodeURIComponent(id.gameName)}-${encodeURIComponent(id.tagLine)}`;
}

/**
 * Slug for a query-string value ("?players=Annie IRL-Annie"). URLSearchParams encodes it once;
 * toSlug's own encoding on top made links like "Annie%2520IRL". fromSlug reads both forms.
 */
export function querySlug(id: RiotId) {
  return `${id.gameName}-${id.tagLine}`;
}

export function fromSlug(slug: string): RiotId | null {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    /* already plain text */
  }
  const i = decoded.lastIndexOf('-');
  if (i <= 0 || i === decoded.length - 1) return null;
  return { gameName: decoded.slice(0, i), tagLine: decoded.slice(i + 1) };
}

export function profilePath(platform: string, id: RiotId, sub?: 'live' | 'stats') {
  return `/lol/${platform}/${toSlug(id)}${sub ? `/${sub}` : ''}`;
}
