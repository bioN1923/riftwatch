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

/** Lobby lines from the English client ("Name joined the lobby"); the name is kept, the rest dropped. */
const LOBBY_SUFFIX = /\s+(?:joined|left) the lobby\.?$/i;

/**
 * Names pasted without a #tag (one per line or comma-separated, or "Name joined the lobby"). A Riot
 * ID needs its tag, so these can't be looked up as they are; the page offers to add the region's
 * default tag, which most players keep. Lines that already hold a "Name#TAG" are left out.
 */
export function untaggedNames(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const piece of text.split(/[\n\r,]+/)) {
    if (piece.includes('#')) continue;
    if (/\bleft the lobby/i.test(piece)) continue;
    const name = piece.replace(LOBBY_SUFFIX, '').replace(/^[\s\-–•*]+/, '').trim();
    // Riot game names are 3–16 characters; longer pieces are sentences, not names.
    if (name.length < 3 || name.length > 16) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** The pasted text with each untagged name given `#tag`, one Riot ID per line. */
export function withDefaultTag(text: string, tag: string): string {
  const tagged = parseLobby(text).map((p) => `${p.gameName}#${p.tagLine}`);
  return [...tagged, ...untaggedNames(text).map((n) => `${n}#${tag}`)].join('\n');
}
