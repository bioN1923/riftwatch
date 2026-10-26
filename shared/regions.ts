/**
 * Riot routing.
 * - "platform" hosts serve summoner/league/mastery/spectator (e.g. euw1.api.riotgames.com)
 * - "regional" hosts serve account-v1 and match-v5 (americas / europe / asia / sea)
 * account-v1 is not served by `sea`, so those platforms use `asia` for account lookups.
 */
export type Regional = 'americas' | 'europe' | 'asia' | 'sea';

export interface Platform {
  id: string; // platform routing value used in URLs, e.g. "euw1"
  label: string; // short label shown in the UI, e.g. "EUW"
  name: string; // full name
  regional: Regional; // match-v5 routing
  accountRegional: Exclude<Regional, 'sea'>; // account-v1 routing
  defaultTag: string; // the tag Riot gives new accounts on this server
}

export const PLATFORMS: Platform[] = [
  { id: 'euw1', label: 'EUW', name: 'Europe West', regional: 'europe', accountRegional: 'europe', defaultTag: 'EUW' },
  { id: 'eun1', label: 'EUNE', name: 'Europe Nordic & East', regional: 'europe', accountRegional: 'europe', defaultTag: 'EUNE' },
  { id: 'na1', label: 'NA', name: 'North America', regional: 'americas', accountRegional: 'americas', defaultTag: 'NA1' },
  { id: 'kr', label: 'KR', name: 'Korea', regional: 'asia', accountRegional: 'asia', defaultTag: 'KR1' },
  { id: 'br1', label: 'BR', name: 'Brazil', regional: 'americas', accountRegional: 'americas', defaultTag: 'BR1' },
  { id: 'la1', label: 'LAN', name: 'Latin America North', regional: 'americas', accountRegional: 'americas', defaultTag: 'LAN' },
  { id: 'la2', label: 'LAS', name: 'Latin America South', regional: 'americas', accountRegional: 'americas', defaultTag: 'LAS' },
  { id: 'oc1', label: 'OCE', name: 'Oceania', regional: 'sea', accountRegional: 'asia', defaultTag: 'OCE' },
  { id: 'tr1', label: 'TR', name: 'Türkiye', regional: 'europe', accountRegional: 'europe', defaultTag: 'TR1' },
  { id: 'ru', label: 'RU', name: 'Russia', regional: 'europe', accountRegional: 'europe', defaultTag: 'RU1' },
  { id: 'me1', label: 'ME', name: 'Middle East', regional: 'europe', accountRegional: 'europe', defaultTag: 'ME1' },
  { id: 'jp1', label: 'JP', name: 'Japan', regional: 'asia', accountRegional: 'asia', defaultTag: 'JP1' },
  { id: 'sg2', label: 'SEA', name: 'Southeast Asia', regional: 'sea', accountRegional: 'asia', defaultTag: 'SG2' },
  { id: 'tw2', label: 'TW', name: 'Taiwan', regional: 'sea', accountRegional: 'asia', defaultTag: 'TW2' },
  { id: 'vn2', label: 'VN', name: 'Vietnam', regional: 'sea', accountRegional: 'asia', defaultTag: 'VN2' },
];

export const PLATFORM_BY_ID: Record<string, Platform> = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

export function getPlatform(id: string | undefined): Platform | undefined {
  return id ? PLATFORM_BY_ID[id.toLowerCase()] : undefined;
}
