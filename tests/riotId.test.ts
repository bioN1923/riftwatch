import { describe, expect, it } from 'vitest';
import { fromSlug, parseRiotId, profilePath, toSlug } from '../src/lib/riotId';
import { parseLobby } from '../src/lib/lobby';

describe('Riot IDs', () => {
  it('parses Name#TAG and falls back to the region tag', () => {
    expect(parseRiotId('Hide on bush#KR1', 'EUW')).toEqual({ gameName: 'Hide on bush', tagLine: 'KR1' });
    expect(parseRiotId('  Caps  ', 'EUW')).toEqual({ gameName: 'Caps', tagLine: 'EUW' });
    expect(parseRiotId('#EUW', 'EUW')).toBeNull();
    expect(parseRiotId('', 'EUW')).toBeNull();
  });

  it('round-trips through URL slugs, including spaces and hyphens in names', () => {
    for (const id of [
      { gameName: 'Hide on bush', tagLine: 'KR1' },
      { gameName: 'Dash-Name', tagLine: 'EUW' },
      { gameName: 'Ünïcødé', tagLine: 'Ø1' },
    ]) {
      expect(fromSlug(toSlug(id))).toEqual(id);
    }
    expect(profilePath('euw1', { gameName: 'A B', tagLine: 'C' }, 'stats')).toBe('/lol/euw1/A%20B-C/stats');
  });
});

describe('lobby parsing', () => {
  it('reads champion-select chat lines', () => {
    const text = 'Hide on bush #KR1 joined the lobby\nCaps#EUW joined the lobby\nRekkles #EUW a rejoint le salon';
    expect(parseLobby(text)).toEqual([
      { gameName: 'Hide on bush', tagLine: 'KR1' },
      { gameName: 'Caps', tagLine: 'EUW' },
      { gameName: 'Rekkles', tagLine: 'EUW' },
    ]);
  });

  it('reads comma-separated ids and removes duplicates', () => {
    expect(parseLobby('Caps#EUW, caps#euw, Upset#EUW')).toEqual([
      { gameName: 'Caps', tagLine: 'EUW' },
      { gameName: 'Upset', tagLine: 'EUW' },
    ]);
  });

  it('ignores lines without a tag', () => {
    expect(parseLobby('Someone joined the lobby')).toEqual([]);
  });
});
