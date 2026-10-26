import type { RiotId } from './riotId';

/**
 * Pull Riot IDs out of whatever was pasted: champion select chat ("Name #TAG joined the lobby"),
 * one per line, or comma-separated. Lobby messages in other languages work too, since only the
 * "Name#TAG" part is used.
 */
export function parseLobby(text: string): RiotId[] {
  const found: RiotId[] = [];
  const seen = new Set<string>();
  const re = /([^\n\r,#:]{2,16}?)\s*#\s*([\p{L}\p{N}]{2,5})(?![\p{L}\p{N}])/gu;
  for (const m of text.matchAll(re)) {
    const gameName = m[1].replace(/^[\s\-–•*]+/, '').trim();
    const tagLine = m[2].trim();
    if (!gameName) continue;
    const key = `${gameName}#${tagLine}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ gameName, tagLine });
    if (found.length >= 10) break;
  }
  return found;
}
